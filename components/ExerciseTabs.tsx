'use client'

interface Exercise {
  id: number
  name: string
}

interface ExerciseTabsProps {
  exercises: Exercise[]
  activeExercise: Exercise | null
  onSelect: (exercise: Exercise) => void
  onAddClick: () => void
}

function capitalize(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function ExerciseTabs({ exercises, activeExercise, onSelect, onAddClick }: ExerciseTabsProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
      <div className="flex items-center gap-1 flex-nowrap">
        {exercises.map((exercise) => {
          const isActive = activeExercise?.id === exercise.id
          return (
            <button
              key={exercise.id}
              onClick={() => onSelect(exercise)}
              className={`
                whitespace-nowrap px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-coral-400 text-white shadow-lg shadow-coral-400/20'
                  : 'bg-leather-800 text-leather-400 hover:bg-leather-700 hover:text-leather-100 border border-leather-600'
                }
              `}
            >
              {capitalize(exercise.name)}
            </button>
          )
        })}

        <button
          onClick={onAddClick}
          className="whitespace-nowrap px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-150 bg-leather-800 text-leather-400 hover:bg-leather-700 hover:text-leather-300 border border-leather-600 border-dashed"
          title="Add exercise"
        >
          +
        </button>
      </div>
    </div>
  )
}
