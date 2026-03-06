"""
Basic smoke test: run_engine returns valid EngineOutput with default lens.
"""

import unittest

from engine.types import EngineInput, SurveyInput
from engine.run import run_engine


def test_run_engine_smoke():
    engine_input = EngineInput(
        user_id="user_1",
        timestamp="2026-03-06T10:00:00Z",
        time_window="7d",
        survey=SurveyInput(
            life_stage="LS_REPRO",
            symptom_inputs=[],
            raw_fields={},
        ),
        labs=[],
        history={},
    )

    output = run_engine(engine_input)

    assert output.user_id == "user_1"
    assert output.time_window == "7d"
    assert output.lens.primary_lens_id == "LENS_BASELINE"


class TestRunSmoke(unittest.TestCase):
    def test_run_engine_smoke(self):
        test_run_engine_smoke()
