-- ============================================================
-- Seed: signal_explainer_map
-- Top 10 active signals × positive_driver + ruled_out_driver templates.
-- Additional contextual_modifier templates for key signals.
-- All copy uses safe clinical language — pattern framing, not diagnosis.
-- ============================================================

delete from signal_explainer_map where approved = true and version = 1;

insert into signal_explainer_map (
  signal_code, explanation_type, template_text,
  required_supporting_answers, conditions_json,
  priority, safe_language_notes,
  approved, version
) values

-- ════════════════════════════════════════════════════════════
-- SIG_SLEEP_DISRUPTION
-- ════════════════════════════════════════════════════════════

('SIG_SLEEP_DISRUPTION', 'positive_driver',
 'Sleep disruption appears to be a meaningful part of the pattern here. Waking during the night or not feeling rested in the morning may be reducing your overall recovery.',
 '["sleep_quality", "night_waking"]',
 '{"all_of": [{"signal_active": "SIG_SLEEP_DISRUPTION"}, {"signal_strength_at_least": ["SIG_SLEEP_DISRUPTION", "mild"]}]}',
 90, 'Use pattern language. Avoid clinical terms like insomnia or disorder.',
 true, 1),

('SIG_SLEEP_DISRUPTION', 'positive_driver',
 'Sleep disruption may be affecting how you recover overnight. On nights when sleep feels more fragmented, energy and mood the next day are often more variable.',
 '["sleep_quality", "unrefreshing_sleep"]',
 '{"all_of": [{"signal_active": "SIG_SLEEP_DISRUPTION"}, {"signal_active": "SIG_UNREFRESHING_SLEEP"}]}',
 85, 'Pair with unrefreshing sleep context when both are active.',
 true, 1),

('SIG_SLEEP_DISRUPTION', 'ruled_out_driver',
 'Sleep disruption does not appear to be a major driver right now. Your sleep quality responses suggest a more settled pattern overall.',
 '["sleep_quality"]',
 '{"not": {"signal_active": "SIG_SLEEP_DISRUPTION"}}',
 80, 'Only display when signal is not active.',
 true, 1),

('SIG_SLEEP_DISRUPTION', 'contextual_modifier',
 'For some people, disrupted sleep is linked to hormonal shifts — particularly around the cycle or during perimenopause. This may be worth exploring if the pattern feels cyclical.',
 '["life_stage", "night_waking"]',
 '{"any_of": [{"equals": ["life_stage", "perimenopause"]}, {"equals": ["life_stage", "postpartum"]}]}',
 70, 'Life-stage contextual note only. Do not use as a primary explainer.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_STRESS_LOAD
-- ════════════════════════════════════════════════════════════

('SIG_STRESS_LOAD', 'positive_driver',
 'Stress appears to be a meaningful part of the current pattern. A sustained load — whether from work, personal demands, or physical pressures — can affect sleep, energy, and recovery over time.',
 '["stress_level", "stress_type"]',
 '{"signal_active": "SIG_STRESS_LOAD"}',
 90, 'Use load language not diagnosis. Do not mention burnout or anxiety.',
 true, 1),

('SIG_STRESS_LOAD', 'positive_driver',
 'The stress you''re carrying appears to be showing up in multiple areas. When stress comes from more than one source at once, the cumulative effect on energy and recovery can be harder to manage.',
 '["stress_level", "stress_type"]',
 '{"all_of": [{"signal_active": "SIG_STRESS_LOAD"}, {"equals": ["stress_type", "Multiple"]}]}',
 85, 'Only use when stress_type = Multiple.',
 true, 1),

('SIG_STRESS_LOAD', 'ruled_out_driver',
 'Stress does not look like the main driver right now. Your responses suggest that stress levels are relatively manageable at the moment.',
 '["stress_level"]',
 '{"not": {"signal_active": "SIG_STRESS_LOAD"}}',
 80, 'Only display when signal is not active.',
 true, 1),

('SIG_STRESS_LOAD', 'contextual_modifier',
 'Physical stress — including intense training or illness recovery — can activate many of the same physiological pathways as psychological stress. This may be worth factoring in if your physical demands have been high.',
 '["stress_type"]',
 '{"equals": ["stress_type", "Physical"]}',
 70, 'Physical stressor modifier only.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_BLOOD_SUGAR_INSTABILITY
-- ════════════════════════════════════════════════════════════

('SIG_BLOOD_SUGAR_INSTABILITY', 'positive_driver',
 'Blood sugar regulation may be part of the energy pattern here. Crashes after meals, persistent sugar cravings, and variable energy through the day can all reflect how your body is managing glucose rhythm.',
 '["crash_post_meal", "sugar_cravings", "energy_crash"]',
 '{"signal_active": "SIG_BLOOD_SUGAR_INSTABILITY"}',
 90, 'Use instability and regulation language. Do not reference diabetes or pre-diabetes directly.',
 true, 1),

('SIG_BLOOD_SUGAR_INSTABILITY', 'positive_driver',
 'Crashes after meals may be contributing to unstable energy through the day. This is a pattern worth paying attention to — and one that often responds well to changes in meal timing and composition.',
 '["crash_post_meal", "energy_crash"]',
 '{"all_of": [{"signal_active": "SIG_BLOOD_SUGAR_INSTABILITY"}, {"equals": ["crash_post_meal", true]}]}',
 85, 'Use when crash_post_meal is confirmed true.',
 true, 1),

('SIG_BLOOD_SUGAR_INSTABILITY', 'positive_driver',
 'Some lab values you''ve shared suggest blood sugar regulation may be worth discussing with your clinician. This is often an area where targeted support can make a meaningful difference.',
 '["lab_glucose_value", "lab_hba1c_value"]',
 '{"any_of": [{"exists": "lab_glucose_value"}, {"exists": "lab_hba1c_value"}]}',
 95, 'Only use when lab data is present. Use collaborative clinical language.',
 true, 1),

('SIG_BLOOD_SUGAR_INSTABILITY', 'ruled_out_driver',
 'Blood sugar instability does not appear to be a primary driver right now. Your responses around meal-related energy and cravings suggest a more stable pattern.',
 '["crash_post_meal", "sugar_cravings"]',
 '{"not": {"signal_active": "SIG_BLOOD_SUGAR_INSTABILITY"}}',
 80, 'Only display when signal is not active.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_PERSISTENT_FATIGUE
-- ════════════════════════════════════════════════════════════

('SIG_PERSISTENT_FATIGUE', 'positive_driver',
 'Fatigue appears to be a consistent part of the day-to-day pattern, rather than something that comes and goes. When it shows up most days at a moderate level, it''s often a signal that something systemic needs attention.',
 '["fatigue_freq", "fatigue_sev"]',
 '{"signal_active": "SIG_PERSISTENT_FATIGUE"}',
 90, 'Use consistent, systemic language. Avoid terms like CFS or medical diagnosis.',
 true, 1),

('SIG_PERSISTENT_FATIGUE', 'positive_driver',
 'Ongoing fatigue that doesn''t fully lift — even after rest — may reflect something beyond lifestyle factors. Nutritional status, hormonal patterns, and sleep quality all feed into this, and it''s worth mapping which levers matter most for you.',
 '["fatigue_freq", "unrefreshing_sleep", "fatigue_sev"]',
 '{"all_of": [{"signal_active": "SIG_PERSISTENT_FATIGUE"}, {"signal_active": "SIG_UNREFRESHING_SLEEP"}]}',
 85, 'Use when unrefreshing sleep co-occurs. Link to recovery framing.',
 true, 1),

('SIG_PERSISTENT_FATIGUE', 'ruled_out_driver',
 'Persistent fatigue does not look like the main pattern right now. Your reported energy and fatigue frequency suggest this is not a dominant factor at the moment.',
 '["fatigue_freq", "fatigue_sev"]',
 '{"not": {"signal_active": "SIG_PERSISTENT_FATIGUE"}}',
 80, 'Only display when signal is not active.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_ENERGY_VARIABILITY
-- ════════════════════════════════════════════════════════════

('SIG_ENERGY_VARIABILITY', 'positive_driver',
 'Energy levels appear to vary more than expected through the day. Afternoon energy dips, variable motivation, and unpredictable crashes can all be part of this pattern.',
 '["energy_crash", "fatigue_timing"]',
 '{"signal_active": "SIG_ENERGY_VARIABILITY"}',
 90, 'Use variability and rhythm language. Not the same as persistent fatigue.',
 true, 1),

('SIG_ENERGY_VARIABILITY', 'positive_driver',
 'Afternoon energy dips appear to be part of the pattern here. While some midday dip is normal, the frequency and impact of yours suggests it may be worth addressing directly.',
 '["energy_crash", "fatigue_timing"]',
 '{"all_of": [{"signal_active": "SIG_ENERGY_VARIABILITY"}, {"equals": ["fatigue_timing", "Afternoon"]}]}',
 85, 'Use when afternoon timing is reported.',
 true, 1),

('SIG_ENERGY_VARIABILITY', 'ruled_out_driver',
 'Energy variability does not appear to be a driver right now. Your responses suggest energy is more consistent through the day.',
 '["energy_crash", "fatigue_timing"]',
 '{"not": {"signal_active": "SIG_ENERGY_VARIABILITY"}}',
 80, 'Only display when signal is not active.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_HORMONAL_VARIABILITY
-- ════════════════════════════════════════════════════════════

('SIG_HORMONAL_VARIABILITY', 'positive_driver',
 'Hormonal shifts may be contributing to some of what you''re noticing. Fluctuations in hormones can affect energy, mood, sleep quality, and skin — often in ways that feel disconnected but share a common root.',
 '["hormone_symptoms", "cycle_regularity"]',
 '{"signal_active": "SIG_HORMONAL_VARIABILITY"}',
 90, 'Use shift and fluctuation language. Avoid naming specific hormones unless supported by lab data.',
 true, 1),

('SIG_HORMONAL_VARIABILITY', 'positive_driver',
 'The combination of hormonal symptoms and changes to skin or hair suggests a pattern that may reflect a broader hormonal shift. This is often worth discussing with a clinician who can look at the full picture.',
 '["hormone_symptoms", "skin_hair_changes"]',
 '{"all_of": [{"signal_active": "SIG_HORMONAL_VARIABILITY"}, {"signal_active": "SIG_SKIN_HAIR_PATTERN"}]}',
 85, 'Use when skin/hair is a co-signal.',
 true, 1),

('SIG_HORMONAL_VARIABILITY', 'ruled_out_driver',
 'Hormonal variability does not appear to be a primary driver based on your responses. Hormone-related symptoms appear to be minimal or absent.',
 '["hormone_symptoms"]',
 '{"not": {"signal_active": "SIG_HORMONAL_VARIABILITY"}}',
 80, 'Only display when signal is not active.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_GUT_DISRUPTION
-- ════════════════════════════════════════════════════════════

('SIG_GUT_DISRUPTION', 'positive_driver',
 'Gut discomfort appears to be a recurring part of your experience. When symptoms like bloating, irregular digestion, or gut discomfort show up frequently, they often point to a pattern worth addressing.',
 '["gut_symptoms", "bloating"]',
 '{"signal_active": "SIG_GUT_DISRUPTION"}',
 90, 'Use pattern and disruption language. Do not diagnose IBS, SIBO, or other conditions.',
 true, 1),

('SIG_GUT_DISRUPTION', 'positive_driver',
 'Frequent gut symptoms combined with bloating and changes in digestion suggest a more chronic pattern. This is an area where what you eat, how you eat, and stress levels often interact.',
 '["gut_symptoms", "bloating", "bowel_changes"]',
 '{"all_of": [{"signal_active": "SIG_GUT_DISRUPTION"}, {"gte": ["bloating", 2]}, {"gte": ["bowel_changes", 1]}]}',
 85, 'Use when all three gut markers are elevated.',
 true, 1),

('SIG_GUT_DISRUPTION', 'ruled_out_driver',
 'Gut disruption does not appear to be a main driver right now. Your gut-related responses suggest symptoms are infrequent or mild.',
 '["gut_symptoms", "bloating"]',
 '{"not": {"signal_active": "SIG_GUT_DISRUPTION"}}',
 80, 'Only display when signal is not active.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_RECOVERY_STRAIN
-- ════════════════════════════════════════════════════════════

('SIG_RECOVERY_STRAIN', 'positive_driver',
 'Recovery between demands may need more time and support right now. When exercise feels harder than expected, rest doesn''t fully restore energy, and stress is elevated, it often signals that your system is working harder to keep up.',
 '["exercise_tolerance", "unrefreshing_sleep", "stress_level"]',
 '{"signal_active": "SIG_RECOVERY_STRAIN"}',
 90, 'Use capacity and support language. Avoid overtraining syndrome framing.',
 true, 1),

('SIG_RECOVERY_STRAIN', 'positive_driver',
 'A combination of reduced exercise tolerance and fatigue that persists even after rest suggests your recovery capacity may be stretched. Pacing and recovery-first strategies are often helpful here.',
 '["exercise_tolerance", "fatigue_freq"]',
 '{"all_of": [{"signal_active": "SIG_RECOVERY_STRAIN"}, {"gte": ["exercise_tolerance", 3]}, {"gte": ["fatigue_freq", 3]}]}',
 85, 'Use when both exercise tolerance and fatigue are elevated.',
 true, 1),

('SIG_RECOVERY_STRAIN', 'ruled_out_driver',
 'Recovery strain does not look like a significant factor right now. Exercise tolerance appears to be holding up, and rest seems to be doing its job.',
 '["exercise_tolerance"]',
 '{"not": {"signal_active": "SIG_RECOVERY_STRAIN"}}',
 80, 'Only display when signal is not active.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_MICRONUTRIENT_PATTERN
-- ════════════════════════════════════════════════════════════

('SIG_MICRONUTRIENT_PATTERN', 'positive_driver',
 'Some patterns here are worth discussing with your clinician — micronutrient levels may be relevant. Fatigue that doesn''t fully resolve with rest, alongside changes in skin or hair, can sometimes reflect nutritional factors.',
 '["fatigue_freq", "fatigue_sev", "skin_hair_changes"]',
 '{"signal_active": "SIG_MICRONUTRIENT_PATTERN"}',
 90, 'Do not name specific deficiencies (iron, B12, etc). Use nutritional factors language.',
 true, 1),

('SIG_MICRONUTRIENT_PATTERN', 'positive_driver',
 'Changes in skin or hair alongside ongoing fatigue can sometimes reflect micronutrient status. This is an area where a simple blood panel can provide useful clarity.',
 '["skin_hair_changes", "fatigue_sev"]',
 '{"all_of": [{"signal_active": "SIG_MICRONUTRIENT_PATTERN"}, {"signal_active": "SIG_SKIN_HAIR_PATTERN"}]}',
 85, 'Use when skin/hair is a co-signal. Recommend clinician review gently.',
 true, 1),

('SIG_MICRONUTRIENT_PATTERN', 'ruled_out_driver',
 'A micronutrient pattern does not appear to be a primary driver based on your responses. Fatigue and skin or hair changes appear to be minimal.',
 '["fatigue_freq", "skin_hair_changes"]',
 '{"not": {"signal_active": "SIG_MICRONUTRIENT_PATTERN"}}',
 80, 'Only display when signal is not active.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_CYCLE_LINKED_PATTERN
-- ════════════════════════════════════════════════════════════

('SIG_CYCLE_LINKED_PATTERN', 'positive_driver',
 'Symptoms may be following a cyclical pattern linked to your hormonal rhythm. When energy, mood, or physical comfort shifts predictably through the month, it often reflects the influence of hormonal fluctuations across the cycle.',
 '["cycle_linked_symptoms", "cycle_regularity"]',
 '{"signal_active": "SIG_CYCLE_LINKED_PATTERN"}',
 90, 'Use cycle and rhythm language. Do not mention PMS or PMDD by name unless user has raised it.',
 true, 1),

('SIG_CYCLE_LINKED_PATTERN', 'positive_driver',
 'Significant cycle-linked symptoms combined with some irregularity suggest hormonal variability may be worth tracking more closely. Mapping symptoms to cycle phase can provide useful patterns over time.',
 '["cycle_linked_symptoms", "cycle_regularity"]',
 '{"all_of": [{"signal_active": "SIG_CYCLE_LINKED_PATTERN"}, {"gte": ["cycle_regularity", 1]}, {"gte": ["cycle_linked_symptoms", 2]}]}',
 85, 'Use when both cycle irregularity and symptoms are moderate+.',
 true, 1),

('SIG_CYCLE_LINKED_PATTERN', 'ruled_out_driver',
 'Cycle-linked symptoms do not appear to be a main driver right now. Your responses suggest these patterns are mild or absent at the moment.',
 '["cycle_linked_symptoms"]',
 '{"not": {"signal_active": "SIG_CYCLE_LINKED_PATTERN"}}',
 80, 'Only display when signal is not active.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_NIGHT_WAKING_PATTERN (bonus — co-signal with sleep disruption)
-- ════════════════════════════════════════════════════════════

('SIG_NIGHT_WAKING_PATTERN', 'positive_driver',
 'Waking during the night may be reducing the quality of your sleep overall. Even when total sleep hours look adequate, fragmented sleep can leave the body less recovered.',
 '["night_waking", "sleep_quality"]',
 '{"signal_active": "SIG_NIGHT_WAKING_PATTERN"}',
 85, 'Use fragmentation and quality language. Not a separate hero driver.',
 true, 1),

('SIG_NIGHT_WAKING_PATTERN', 'ruled_out_driver',
 'Night waking does not appear to be disrupting your sleep pattern. Your responses suggest sleep continuity is mostly intact.',
 '["night_waking"]',
 '{"not": {"signal_active": "SIG_NIGHT_WAKING_PATTERN"}}',
 75, 'Only display when signal is not active.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_UNREFRESHING_SLEEP (bonus)
-- ════════════════════════════════════════════════════════════

('SIG_UNREFRESHING_SLEEP', 'positive_driver',
 'Sleep may not be feeling as restorative as you''d expect. Waking up without feeling rested — even after a full night — is a pattern that often reflects something worth looking at more closely.',
 '["unrefreshing_sleep", "fatigue_timing"]',
 '{"signal_active": "SIG_UNREFRESHING_SLEEP"}',
 85, 'Use restorative and pattern language. Not a standalone diagnosis signal.',
 true, 1),

('SIG_UNREFRESHING_SLEEP', 'ruled_out_driver',
 'Sleep appears to be reasonably restorative based on your responses. Waking feeling rested is a positive sign.',
 '["unrefreshing_sleep"]',
 '{"not": {"signal_active": "SIG_UNREFRESHING_SLEEP"}}',
 75, 'Only display when signal is not active.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_STRESS_SENSITIVITY
-- ════════════════════════════════════════════════════════════

('SIG_STRESS_SENSITIVITY', 'positive_driver',
 'Your system may be responding more strongly to stress than usual. Even moderate stress levels can produce noticeable effects on sleep, energy, and mood when sensitivity is elevated.',
 '["stress_level", "sleep_quality", "energy_crash"]',
 '{"signal_active": "SIG_STRESS_SENSITIVITY"}',
 85, 'Distinguish from stress load. Sensitivity is about amplification, not just volume.',
 true, 1),

('SIG_STRESS_SENSITIVITY', 'ruled_out_driver',
 'Stress sensitivity does not appear to be amplifying other patterns right now. The downstream effects of stress on sleep and energy appear manageable.',
 '["stress_level", "energy_crash"]',
 '{"not": {"signal_active": "SIG_STRESS_SENSITIVITY"}}',
 75, 'Only display when signal is not active.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_LOW_CONTEXT_PATTERN (baseline framing)
-- ════════════════════════════════════════════════════════════

('SIG_LOW_CONTEXT_PATTERN', 'positive_driver',
 'Overall patterns look relatively settled right now. With few active signals across key areas, this appears to be a period of relative stability — a good time to focus on maintaining what''s working.',
 '["fatigue_freq", "sleep_quality", "stress_level"]',
 '{"signal_active": "SIG_LOW_CONTEXT_PATTERN"}',
 80, 'Use stability and maintenance language. Avoid implying the user is "fine" in a dismissive way.',
 true, 1),

('SIG_LOW_CONTEXT_PATTERN', 'contextual_modifier',
 'Because overall symptom load is low, your dashboard focuses on preventive priorities rather than active patterns. This is a useful time to build habits that support long-term resilience.',
 '[]',
 '{"signal_active": "SIG_LOW_CONTEXT_PATTERN"}',
 70, 'Preventive framing modifier for baseline state.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_CONTRADICTORY_PATTERN (meta framing)
-- ════════════════════════════════════════════════════════════

('SIG_CONTRADICTORY_PATTERN', 'positive_driver',
 'Some patterns here appear to be pulling in different directions — for example, sleep quality rating appears relatively good, but fatigue is still present. This kind of inconsistency can sometimes mean that the survey alone doesn''t fully capture what''s going on, and a clinical conversation may be helpful.',
 '["sleep_quality", "fatigue_freq"]',
 '{"signal_active": "SIG_CONTRADICTORY_PATTERN"}',
 85, 'Use careful, non-alarming language. Suggest additional context or clinical review.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_IMPROVING_TREND (positive reinforcement)
-- ════════════════════════════════════════════════════════════

('SIG_IMPROVING_TREND', 'positive_driver',
 'Overall patterns appear to be moving in a positive direction. Sleep, energy, and stress all look relatively settled, which suggests your current approach may be working well.',
 '["sleep_quality", "fatigue_freq", "stress_level"]',
 '{"signal_active": "SIG_IMPROVING_TREND"}',
 80, 'Use reinforcement language. Acknowledge stability without over-claiming.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_DECLINING_TREND (supportive, not alarmist)
-- ════════════════════════════════════════════════════════════

('SIG_DECLINING_TREND', 'positive_driver',
 'Several areas appear to need support at the same time. When fatigue, sleep, and stress are all elevated together, the combined load can make it harder for any single intervention to make a difference — a more integrated approach tends to work better.',
 '["fatigue_freq", "fatigue_sev", "sleep_quality", "stress_level"]',
 '{"signal_active": "SIG_DECLINING_TREND"}',
 85, 'Use supportive, integrated-approach language. Do not alarm. Never use declining without a paired recommendation frame.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_METABOLIC_VARIABILITY
-- ════════════════════════════════════════════════════════════

('SIG_METABOLIC_VARIABILITY', 'positive_driver',
 'Metabolic rhythm may be contributing to energy variability throughout the day. Sugar cravings and periodic energy crashes — without a clear post-meal trigger — can reflect how the body is managing fuel and demand.',
 '["sugar_cravings", "energy_crash"]',
 '{"signal_active": "SIG_METABOLIC_VARIABILITY"}',
 85, 'Use metabolic rhythm language. Distinguish from confirmed blood sugar instability.',
 true, 1),

('SIG_METABOLIC_VARIABILITY', 'ruled_out_driver',
 'Metabolic variability does not appear to be a primary driver. Sugar cravings and energy crashes appear to be minimal based on your responses.',
 '["sugar_cravings", "energy_crash"]',
 '{"not": {"signal_active": "SIG_METABOLIC_VARIABILITY"}}',
 75, 'Only display when signal is not active.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_APPETITE_INSTABILITY
-- ════════════════════════════════════════════════════════════

('SIG_APPETITE_INSTABILITY', 'positive_driver',
 'Appetite and hunger cues may be less stable than usual right now. Irregular appetite patterns — particularly when combined with gut discomfort — can reflect a disruption in how the body is signalling hunger and fullness.',
 '["sugar_cravings", "gut_symptoms"]',
 '{"signal_active": "SIG_APPETITE_INSTABILITY"}',
 85, 'Use signalling and rhythm language. Avoid eating disorder framing.',
 true, 1),

('SIG_APPETITE_INSTABILITY', 'ruled_out_driver',
 'Appetite instability does not appear to be a driver right now. Hunger cues and cravings appear to be manageable.',
 '["sugar_cravings"]',
 '{"not": {"signal_active": "SIG_APPETITE_INSTABILITY"}}',
 75, 'Only display when signal is not active.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_SKIN_HAIR_PATTERN
-- ════════════════════════════════════════════════════════════

('SIG_SKIN_HAIR_PATTERN', 'positive_driver',
 'Changes in skin or hair may reflect a shift worth paying attention to. These can sometimes be early signals of hormonal, nutritional, or inflammatory changes — and are often worth mentioning to your clinician.',
 '["skin_hair_changes"]',
 '{"signal_active": "SIG_SKIN_HAIR_PATTERN"}',
 85, 'Use early signal language. Do not name specific conditions.',
 true, 1),

('SIG_SKIN_HAIR_PATTERN', 'ruled_out_driver',
 'Skin and hair changes do not appear to be a notable pattern right now based on your responses.',
 '["skin_hair_changes"]',
 '{"not": {"signal_active": "SIG_SKIN_HAIR_PATTERN"}}',
 75, 'Only display when signal is not active.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_CARDIO_STRAIN_CONTEXT
-- ════════════════════════════════════════════════════════════

('SIG_CARDIO_STRAIN_CONTEXT', 'positive_driver',
 'Your cardiovascular system may benefit from reduced strain right now. Reduced exercise tolerance alongside elevated stress and fatigue can sometimes reflect the body managing a higher-than-usual load.',
 '["exercise_tolerance", "stress_level", "fatigue_freq"]',
 '{"signal_active": "SIG_CARDIO_STRAIN_CONTEXT"}',
 85, 'Use reduced strain language. Not a cardiac warning. Low specificity signal.',
 true, 1),

('SIG_CARDIO_STRAIN_CONTEXT', 'ruled_out_driver',
 'Cardiovascular strain does not appear to be a contextual concern right now. Exercise tolerance appears to be holding up.',
 '["exercise_tolerance"]',
 '{"not": {"signal_active": "SIG_CARDIO_STRAIN_CONTEXT"}}',
 75, 'Only display when signal is not active.',
 true, 1),

-- ════════════════════════════════════════════════════════════
-- SIG_SLEEP_LATENCY_PATTERN
-- ════════════════════════════════════════════════════════════

('SIG_SLEEP_LATENCY_PATTERN', 'positive_driver',
 'It may be taking longer than expected to fall asleep. Delayed sleep onset — particularly when it happens regularly — often reflects an activated nervous system that hasn''t fully shifted into rest mode.',
 '["sleep_latency", "stress_level"]',
 '{"signal_active": "SIG_SLEEP_LATENCY_PATTERN"}',
 85, 'Use nervous system and onset language. Avoid sleep hygiene prescriptiveness.',
 true, 1),

('SIG_SLEEP_LATENCY_PATTERN', 'ruled_out_driver',
 'Sleep onset does not appear to be a concern. Your responses suggest you''re falling asleep within a normal range.',
 '["sleep_latency"]',
 '{"not": {"signal_active": "SIG_SLEEP_LATENCY_PATTERN"}}',
 75, 'Only display when signal is not active.',
 true, 1);
