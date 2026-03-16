"""
Tests for the watch-item catalog and build_watch_items.

- Catalog coverage: every cluster-backed watch item mapping is loadable.
- Per-cluster max: a single cluster never contributes more than 2 watch items.
- Global max: output length <= 3.
- Ranking: higher strength/confidence/persistence wins.
- Language safety: descriptions pass validator and remain monitoring-oriented.
- Snapshot: sleep + energy + gut produces 3 clean items.
"""

from __future__ import annotations

import re

import pytest

from client_output.contracts import WatchItemVM
from client_output.watch_catalog import (
    WATCH_ITEM_CATALOG,
    build_watch_items,
    MAX_ITEMS_GLOBAL,
    MAX_ITEMS_PER_CLUSTER,
)


# ---------------------------------------------------------------------------
# Catalog coverage: every cluster-backed watch item mapping is loadable
# ---------------------------------------------------------------------------

def test_watch_catalog_all_entries_loadable():
    """Every cluster in the catalog has at least one item with title and description."""
    for cluster_id, items in WATCH_ITEM_CATALOG.items():
        assert isinstance(items, list), f"{cluster_id}: catalog value must be a list"
        assert len(items) >= 1, f"{cluster_id}: at least one watch item required"
        assert len(items) <= MAX_ITEMS_PER_CLUSTER, (
            f"{cluster_id}: at most {MAX_ITEMS_PER_CLUSTER} items per cluster"
        )
        for i, entry in enumerate(items):
            assert isinstance(entry, dict), f"{cluster_id}[{i}]: entry must be dict"
            title = entry.get("title")
            description = entry.get("description")
            assert title, f"{cluster_id}[{i}]: title required"
            assert isinstance(description, str), f"{cluster_id}[{i}]: description must be str"


def test_watch_catalog_all_cluster_ids_resolve_to_items():
    """Building watch items from each catalog cluster yields valid WatchItemVMs."""
    for cluster_id in WATCH_ITEM_CATALOG:
        clusters = [
            {"cluster_id": cluster_id, "strength": 50.0, "confidence": 50.0}
        ]
        items = build_watch_items(clusters, None)
        assert len(items) >= 1, f"{cluster_id}: should yield at least one item"
        for vm in items:
            assert isinstance(vm, WatchItemVM)
            assert vm.title
            assert vm.description


# ---------------------------------------------------------------------------
# Per-cluster max: a single cluster never contributes more than 2 items
# ---------------------------------------------------------------------------

def test_per_cluster_max_two_items():
    """A single qualifying cluster contributes at most 2 watch items."""
    # Use a cluster that has 2 catalog entries (e.g. CL_SLEEP_DISRUPT, CL_ENERGY_VAR)
    clusters = [
        {"cluster_id": "CL_SLEEP_DISRUPT", "strength": 80.0, "confidence": 80.0},
    ]
    items = build_watch_items(clusters, None)
    assert len(items) <= MAX_ITEMS_PER_CLUSTER
    # CL_SLEEP_DISRUPT has 2 entries; we should get 2
    assert len(items) == 2
    titles = [vm.title for vm in items]
    assert "Sleep quality" in titles
    assert "Sleep timing" in titles


def test_per_cluster_max_when_multiple_clusters():
    """With many clusters, no cluster appears more than 2 times in the top 3."""
    clusters = [
        {"cluster_id": "CL_SLEEP_DISRUPT", "strength": 90.0, "confidence": 90.0},
        {"cluster_id": "CL_ENERGY_VAR", "strength": 85.0, "confidence": 85.0},
        {"cluster_id": "CL_GUT_PATTERN", "strength": 80.0, "confidence": 80.0},
    ]
    items = build_watch_items(clusters, None)
    titles = [vm.title for vm in items]
    # We get max 3; sleep has 2, energy has 2, gut has 2. Top 3 by rank: 2 from sleep, 1 from energy (or 2 sleep + 1 energy)
    assert len(items) <= MAX_ITEMS_GLOBAL
    # Count how many come from same "logical cluster" by known titles
    sleep_titles = {"Sleep quality", "Sleep timing"}
    energy_titles = {"Daily energy patterns", "Afternoon energy dips"}
    sleep_count = sum(1 for t in titles if t in sleep_titles)
    energy_count = sum(1 for t in titles if t in energy_titles)
    assert sleep_count <= MAX_ITEMS_PER_CLUSTER
    assert energy_count <= MAX_ITEMS_PER_CLUSTER


# ---------------------------------------------------------------------------
# Global max: output length <= 3
# ---------------------------------------------------------------------------

def test_global_max_three_items():
    """build_watch_items returns at most 3 items."""
    clusters = [
        {"cluster_id": "CL_SLEEP_DISRUPT", "strength": 95.0, "confidence": 95.0},
        {"cluster_id": "CL_ENERGY_VAR", "strength": 90.0, "confidence": 90.0},
        {"cluster_id": "CL_GUT_PATTERN", "strength": 85.0, "confidence": 85.0},
        {"cluster_id": "CL_STRESS_ACCUM", "strength": 80.0, "confidence": 80.0},
    ]
    items = build_watch_items(clusters, None)
    assert len(items) <= MAX_ITEMS_GLOBAL
    assert len(items) == 3


def test_global_max_with_fewer_than_three_qualifying():
    """When only 1 or 2 clusters qualify, we get 1 or 2 items."""
    items1 = build_watch_items(
        [{"cluster_id": "CL_STRESS_ACCUM", "strength": 70.0, "confidence": 70.0}],
        None,
    )
    assert len(items1) == 1
    items2 = build_watch_items(
        [
            {"cluster_id": "CL_STRESS_ACCUM", "strength": 70.0, "confidence": 70.0},
            {"cluster_id": "CL_THYROID_SIGNALS", "strength": 65.0, "confidence": 65.0},
        ],
        None,
    )
    assert len(items2) == 2


# ---------------------------------------------------------------------------
# Ranking: higher strength/confidence/persistence wins
# ---------------------------------------------------------------------------

def test_ranking_by_strength_and_confidence():
    """Given 4 candidate clusters, higher strength/confidence yields items first."""
    clusters = [
        {"cluster_id": "CL_GUT_PATTERN", "strength": 40.0, "confidence": 50.0},
        {"cluster_id": "CL_ENERGY_VAR", "strength": 70.0, "confidence": 70.0},
        {"cluster_id": "CL_SLEEP_DISRUPT", "strength": 90.0, "confidence": 85.0},
        {"cluster_id": "CL_STRESS_ACCUM", "strength": 60.0, "confidence": 65.0},
    ]
    items = build_watch_items(clusters, None)
    assert len(items) == 3
    titles = [vm.title for vm in items]
    # Top cluster is CL_SLEEP_DISRUPT (90, 85) -> Sleep quality, Sleep timing
    # Next CL_ENERGY_VAR (70, 70) -> Daily energy patterns (or afternoon)
    assert "Sleep quality" in titles
    assert "Sleep timing" in titles
    assert "Daily energy patterns" in titles or "Afternoon energy dips" in titles
    # CL_GUT_PATTERN (40, 50) should not appear (lowest rank)
    assert "Digestion comfort" not in titles and "Bowel pattern changes" not in titles


def test_ranking_by_temporal_persistence():
    """Higher temporal persistence for a cluster gives its items priority when strength/confidence tie."""
    # Two clusters with same strength/confidence; give one higher persistence
    temporal = {"CL_ENERGY_VAR": 10.0, "CL_SLEEP_DISRUPT": 5.0}
    clusters = [
        {"cluster_id": "CL_SLEEP_DISRUPT", "strength": 70.0, "confidence": 70.0},
        {"cluster_id": "CL_ENERGY_VAR", "strength": 70.0, "confidence": 70.0},
    ]
    items = build_watch_items(clusters, temporal)
    # CL_ENERGY_VAR has higher persistence (10) so its items should appear before CL_SLEEP_DISRUPT (5)
    assert len(items) >= 2
    titles = [vm.title for vm in items]
    # First two should be from energy (higher persistence)
    assert titles[0] in ("Daily energy patterns", "Afternoon energy dips")
    assert titles[1] in ("Daily energy patterns", "Afternoon energy dips") or titles[1] in ("Sleep quality", "Sleep timing")


# ---------------------------------------------------------------------------
# Language safety: descriptions pass validator and remain monitoring-oriented
# ---------------------------------------------------------------------------

def test_watch_item_descriptions_pass_language_safety():
    """All catalog descriptions pass language safety (dashboard context)."""
    from client_output.language_safety import validate_text, ValidationContext
    for cluster_id, entries in WATCH_ITEM_CATALOG.items():
        for entry in entries:
            desc = entry.get("description", "")
            # Should not raise
            validate_text(desc, "dashboard")


def test_watch_item_output_has_no_forbidden_phrases():
    """Built watch items do not contain forbidden diagnostic language."""
    forbidden = re.compile(
        r"\b(diagnosis|diagnostic|you have|indicates|proves|confirms|treatment recommendation)\b",
        re.IGNORECASE,
    )
    for cluster_id in WATCH_ITEM_CATALOG:
        clusters = [{"cluster_id": cluster_id, "strength": 50.0, "confidence": 50.0}]
        items = build_watch_items(clusters, None)
        for vm in items:
            assert not forbidden.search(vm.title), f"title: {vm.title}"
            assert not forbidden.search(vm.description), f"description: {vm.description}"


# ---------------------------------------------------------------------------
# Snapshot: sleep + energy + gut produces 3 clean items
# ---------------------------------------------------------------------------

def test_snapshot_sleep_energy_gut_three_items():
    """Example with sleep, energy, and gut produces 3 clean items (ranked by strength/confidence)."""
    clusters = [
        {"cluster_id": "CL_SLEEP_DISRUPT", "strength": 75.0, "confidence": 72.0},
        {"cluster_id": "CL_ENERGY_VAR", "strength": 72.0, "confidence": 70.0},
        {"cluster_id": "CL_GUT_PATTERN", "strength": 68.0, "confidence": 65.0},
    ]
    items = build_watch_items(clusters, None)
    assert len(items) == 3
    for vm in items:
        assert isinstance(vm, WatchItemVM)
        assert vm.title
        assert vm.description
        assert len(vm.title) <= 50  # reasonable length
    titles = {vm.title for vm in items}
    # Top 3 by rank: sleep (75/72) and energy (72/70) fill the slots; gut (68/65) may not appear
    assert any("Sleep" in t for t in titles)
    assert any("energy" in t.lower() or "Energy" in t for t in titles)
    # All titles must be from the catalog for these three clusters
    allowed = {
        "Sleep quality", "Sleep timing",
        "Daily energy patterns", "Afternoon energy dips",
        "Digestion comfort", "Bowel pattern changes",
    }
    for t in titles:
        assert t in allowed, f"Unexpected title: {t!r}"


def test_snapshot_serialized_no_raw_ids():
    """Serialized watch items must not contain raw cluster IDs."""
    raw_id_pattern = re.compile(r"\bCL_[A-Z0-9_]+\b")
    clusters = [
        {"cluster_id": "CL_SLEEP_DISRUPT", "strength": 80.0, "confidence": 80.0},
        {"cluster_id": "CL_ENERGY_VAR", "strength": 75.0, "confidence": 75.0},
    ]
    items = build_watch_items(clusters, None)
    for vm in items:
        dumped = vm.model_dump()
        for key, value in dumped.items():
            if isinstance(value, str) and raw_id_pattern.search(value):
                raise AssertionError(f"Raw cluster ID in output: {key}={value!r}")
        assert "cluster_id" not in dumped


# ---------------------------------------------------------------------------
# Thresholds: only qualifying clusters generate items
# ---------------------------------------------------------------------------

def test_below_threshold_produces_no_items():
    """Clusters below strength/confidence thresholds produce no items (when thresholds set)."""
    clusters = [
        {"cluster_id": "CL_SLEEP_DISRUPT", "strength": 10.0, "confidence": 10.0},
    ]
    items = build_watch_items(
        clusters,
        None,
        strength_threshold=40.0,
        confidence_threshold=40.0,
    )
    assert len(items) == 0


def test_above_threshold_produces_items():
    """Clusters above thresholds produce items."""
    clusters = [
        {"cluster_id": "CL_SLEEP_DISRUPT", "strength": 50.0, "confidence": 50.0},
    ]
    items = build_watch_items(
        clusters,
        None,
        strength_threshold=40.0,
        confidence_threshold=40.0,
    )
    assert len(items) >= 1


def test_mixed_threshold_only_qualifying_included():
    """Only clusters meeting both thresholds contribute."""
    clusters = [
        {"cluster_id": "CL_SLEEP_DISRUPT", "strength": 60.0, "confidence": 30.0},  # below conf
        {"cluster_id": "CL_ENERGY_VAR", "strength": 50.0, "confidence": 50.0},       # qualifies
    ]
    items = build_watch_items(
        clusters,
        None,
        strength_threshold=40.0,
        confidence_threshold=40.0,
    )
    titles = [vm.title for vm in items]
    assert "Sleep quality" not in titles and "Sleep timing" not in titles
    assert "Daily energy patterns" in titles or "Afternoon energy dips" in titles
