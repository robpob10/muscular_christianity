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

export default function ExerciseTabs({
  exercises,
  activeExercise,
  onSelect,
  onAddClick,
}: ExerciseTabsProps) {
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
                ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                }
              `}
            >
              {capitalize(exercise.name)}
            </button>
          )
        })}

        <button
          onClick={onAddClick}
          className="whitespace-nowrap px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-150 bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-orange-400 border border-zinc-700 border-dashed"
          title="Add exercise"
        >
          +
        </button>
      </div>
    </div>
  )
}
