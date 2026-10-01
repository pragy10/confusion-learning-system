import { CONFUSION_TYPES } from "../../utils/telemetry";

const confusionOptions = [
  {
    type: CONFUSION_TYPES.TOO_FAST,
    label: "Too Fast",
    description: "The explanation moved too quickly",
    position: "top-0 left-1/2 -translate-x-1/2",
  },
  {
    type: CONFUSION_TYPES.MISSED_TERM,
    label: "Missed a Term",
    description: "I don't understand a term",
    position: "top-1/2 right-0 -translate-y-1/2",
  },
  {
    type: CONFUSION_TYPES.LOST_THE_LOGIC,
    label: "Lost the Logic",
    description: "I lost the reasoning",
    position: "bottom-0 left-1/2 -translate-x-1/2",
  },
  {
    type: CONFUSION_TYPES.LOST_BIGGER_PICTURE,
    label: "Bigger Picture",
    description: "I lost the overall context",
    position: "top-1/2 left-0 -translate-y-1/2",
  },
];

function RadialMenu({ onSelect, onClose }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative h-80 w-80">
        {confusionOptions.map((option) => (
          <button
            key={option.type}
            onClick={() => onSelect(option.type)}
            className={`absolute ${option.position} group flex h-24 w-24 flex-col items-center justify-center rounded-full border border-cyan-400/40 bg-slate-900 text-center shadow-lg transition duration-200 hover:scale-110 hover:border-cyan-300 hover:bg-slate-800`}
          >
            <span className="text-sm font-semibold text-white">
              {option.label}
            </span>

            <span className="mt-1 hidden w-28 text-[10px] leading-tight text-slate-400 group-hover:block">
              {option.description}
            </span>
          </button>
        ))}

        <button
          onClick={onClose}
          className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-600 bg-slate-950 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default RadialMenu;