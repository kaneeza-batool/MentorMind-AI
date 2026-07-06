"""
Coach Agent — tracks per-topic mastery and identifies weak areas.

Centralises the mastery-computation logic that was previously scattered
across the quiz router. The quiz router delegates score → mastery delta
to this agent, keeping business logic out of HTTP handlers.
"""
import logging

logger = logging.getLogger(__name__)

# Mastery weight: how much a single quiz attempt affects stored mastery.
# 0.4 means a perfect score adds 40 mastery points.
MASTERY_WEIGHT = 0.4
PASS_THRESHOLD = 70.0


class CoachAgent:
    NAME = "coach"
    DESCRIPTION = (
        "Tracks per-topic mastery from quiz results, identifies weak concept areas, "
        "and signals the Strategist when the curriculum should adapt."
    )

    @property
    def config(self) -> dict:
        return {
            "name":        self.NAME,
            "description": self.DESCRIPTION,
            "model":       "rule-based",   # No LLM required — deterministic mastery math
            "status":      "active",
        }

    def analyze(
        self,
        topic_id:         str,
        score:            float,
        correct:          int,
        total:            int,
        weak_question_ids: list[str],
        current_mastery:  float = 0.0,
        current_weak:     list[str] | None = None,
    ) -> dict:
        """
        Compute updated mastery and weak areas from a single quiz attempt.

        Returns:
            {
                mastery_delta:   float,   # points added this attempt
                new_mastery:     float,   # clamped 0-100
                weak_areas:      list,    # updated weak concept list
                passed:          bool,
                should_adapt:    bool,    # signal for StrategistAgent
            }
        """
        mastery_delta = round(score * MASTERY_WEIGHT, 1)
        new_mastery   = min(100.0, current_mastery + mastery_delta)
        passed        = score >= PASS_THRESHOLD

        # Merge weak areas — add new ones, keep known ones if still failing
        existing_weak = list(current_weak or [])
        if weak_question_ids:
            merged = list(dict.fromkeys(existing_weak + weak_question_ids))
        else:
            merged = existing_weak

        # Signal adaptation if mastery is critically low after this attempt
        should_adapt = (not passed) and (new_mastery < 50.0)

        logger.info(
            "CoachAgent: topic=%s score=%.1f%% mastery: %.1f → %.1f passed=%s adapt=%s",
            topic_id, score, current_mastery, new_mastery, passed, should_adapt,
        )

        return {
            "mastery_delta": mastery_delta,
            "new_mastery":   new_mastery,
            "weak_areas":    merged,
            "passed":        passed,
            "should_adapt":  should_adapt,
        }
