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
  return str.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const GRAD = 'linear-gradient(135deg, #f87171 0%, #fb923c 50%, #A67C52 100%)'
const activeStyle = {
  background: `linear-gradient(#000, #000) padding-box, ${GRAD} border-box`,
  border: '2px solid transparent',
}

export default function ExerciseTabs({ exercises, activeExercise, onSelect, onAddClick }: ExerciseTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <div className="flex items-center gap-2 flex-nowrap">
        {exercises.map((exercise) => {
          const isActive = activeExercise?.id === exercise.id
          return (
            <button
              key={exercise.id}
              onClick={() => onSelect(exercise)}
              style={isActive ? activeStyle : {}}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'text-white'
                  : 'text-leather-500 border border-leather-800 hover:text-leather-200 hover:border-leather-600'
              }`}
            >
              {capitalize(exercise.name)}
            </button>
          )
        })}

        <button
          onClick={onAddClick}
          className="whitespace-nowrap px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 text-leather-600 border border-dashed border-leather-800 hover:text-leather-300 hover:border-leather-600"
          title="Add exercise"
        >
          +
        </button>
      </div>
    </div>
  )
}
