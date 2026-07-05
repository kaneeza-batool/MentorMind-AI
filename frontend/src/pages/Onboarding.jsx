import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useLearningStore from '@/store/learningStore'

import OnboardingShell  from '@/components/onboarding/OnboardingShell'
import PreparingScreen  from '@/components/onboarding/PreparingScreen'
import WelcomeStep      from '@/components/onboarding/steps/WelcomeStep'
import SkillLevelStep   from '@/components/onboarding/steps/SkillLevelStep'
import GoalStep         from '@/components/onboarding/steps/GoalStep'
import TimeStep         from '@/components/onboarding/steps/TimeStep'
import DeadlineStep     from '@/components/onboarding/steps/DeadlineStep'
import LearningStyleStep from '@/components/onboarding/steps/LearningStyleStep'

const STEPS = [
  { id: 'welcome',  Component: WelcomeStep },
  { id: 'level',    Component: SkillLevelStep },
  { id: 'goal',     Component: GoalStep },
  { id: 'time',     Component: TimeStep },
  { id: 'deadline', Component: DeadlineStep },
  { id: 'style',    Component: LearningStyleStep },
]

const slideVariants = {
  enter:  (dir) => ({ x: dir > 0 ? 52 : -52, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir) => ({ x: dir > 0 ? -52 : 52, opacity: 0 }),
}

export default function Onboarding() {
  const [step, setStep]           = useState(0)
  const [direction, setDirection] = useState(1)
  const [isPreparing, setIsPreparing] = useState(false)

  const { skill, level, goal, dailyMinutes, deadline, learningStyle } = useLearningStore()

  const canContinue = (() => {
    switch (STEPS[step]?.id) {
      case 'welcome':  return skill.trim().length >= 2
      case 'level':    return !!level
      case 'goal':     return goal.trim().length >= 4
      case 'time':     return dailyMinutes > 0
      case 'deadline': return !!deadline
      case 'style':    return !!learningStyle
      default:         return false
    }
  })()

  const isLastStep = step === STEPS.length - 1

  const handleNext = () => {
    if (!canContinue) return
    if (isLastStep) { setIsPreparing(true); return }
    setDirection(1)
    setStep((s) => s + 1)
  }

  const handleBack = () => {
    if (step === 0) return
    setDirection(-1)
    setStep((s) => s - 1)
  }

  if (isPreparing) return <PreparingScreen />

  const { Component } = STEPS[step]

  return (
    <OnboardingShell
      step={step}
      totalSteps={STEPS.length}
      onBack={handleBack}
      onNext={handleNext}
      canContinue={canContinue}
      isLastStep={isLastStep}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
        >
          <Component onNext={handleNext} />
        </motion.div>
      </AnimatePresence>
    </OnboardingShell>
  )
}
