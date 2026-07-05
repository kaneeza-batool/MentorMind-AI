"""
Root Agent — ADK entry point that owns all sub-agents.

In the full ADK setup, the root LlmAgent receives a session-scoped message,
determines intent, and delegates to the appropriate specialist. For M4, it
acts as a registry/orchestrator; agent logic is wired in M5-M7.
"""
from agents.strategist_agent import StrategistAgent
from agents.mentor_agent import MentorAgent
from agents.examiner_agent import ExaminerAgent
from agents.coach_agent import CoachAgent
from agents.resource_agent import ResourceAgent
from agents.reflection_agent import ReflectionAgent


class RootAgent:
    NAME = "root"
    DESCRIPTION = "Orchestrates all MentorMind sub-agents."

    def __init__(self):
        self.strategist = StrategistAgent()
        self.mentor = MentorAgent()
        self.examiner = ExaminerAgent()
        self.coach = CoachAgent()
        self.resource = ResourceAgent()
        self.reflection = ReflectionAgent()

    @property
    def agent_names(self) -> list[str]:
        return [
            self.strategist.NAME,
            self.mentor.NAME,
            self.examiner.NAME,
            self.coach.NAME,
            self.resource.NAME,
            self.reflection.NAME,
        ]

    @property
    def agent_configs(self) -> list[dict]:
        return [
            self.strategist.config,
            self.mentor.config,
            self.examiner.config,
            self.coach.config,
            self.resource.config,
            self.reflection.config,
        ]
