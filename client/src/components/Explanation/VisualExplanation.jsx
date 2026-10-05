function SequenceDiagram({ visual }) {
  const nodes = visual?.nodes || [];
  const relationships = visual?.relationships || [];

  return (
    <div className="mt-4 overflow-x-auto pb-2">
      <div className="flex min-w-max items-center gap-2">
        {nodes.map((node, index) => {
          const relationship = relationships[index];
          return (
            <div key={`${node}-${index}`} className="flex items-center gap-2">
              <div className="flex min-h-14 min-w-28 max-w-40 items-center justify-center rounded-lg border border-slate-700 bg-[#0a0a0a] shadow-sm px-3 py-2 text-center text-xs font-medium text-slate-200">
                {node}
              </div>
              {index < nodes.length - 1 && (
                <div className="flex flex-col items-center">
                  <span className="mb-1 max-w-20 text-center text-[10px] text-slate-400">
                    {relationship?.label || ""}
                  </span>
                  <span className="text-lg text-slate-500">→</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


function CauseEffectDiagram({ visual }) {
  const nodes = visual?.nodes || [];
  const relationships =
    visual?.relationships || [];

  return (
    <div className="mt-4 space-y-4">
      {relationships.length > 0 ? (
        relationships.map(
          (relationship, index) => (
            <div
              key={`${relationship.from}-${relationship.to}-${index}`}
              className="flex flex-col items-center gap-2 sm:flex-row"
            >
              <div className="flex min-h-14 flex-1 items-center justify-center rounded-lg border border-slate-700 bg-[#0a0a0a] shadow-sm px-4 py-3 text-center text-sm font-medium text-slate-200">
                {relationship.from}
              </div>

              <div className="flex flex-col items-center px-2">
                <span className="text-[10px] text-slate-400">
                  {relationship.label}
                </span>

                <span className="text-lg text-slate-500">
                  →
                </span>
              </div>

              <div className="flex min-h-14 flex-1 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 shadow-sm px-4 py-3 text-center text-sm font-medium text-slate-200">
                {relationship.to}
              </div>
            </div>
          )
        )
      ) : (
        nodes.map((node, index) => (
          <div
            key={`${node}-${index}`}
            className="rounded-lg border border-slate-700 bg-[#0a0a0a] shadow-sm p-4 text-center text-sm text-slate-200"
          >
            {node}
          </div>
        ))
      )}
    </div>
  );
}


function HierarchyDiagram({ visual }) {
  const nodes = visual?.nodes || [];

  if (nodes.length === 0) {
    return null;
  }

  const root = nodes[0];
  const children = nodes.slice(1);

  return (
    <div className="mt-4">
      <div className="flex justify-center">
        <div className="rounded-lg border border-slate-600 bg-slate-800 shadow-sm px-6 py-4 text-center text-sm font-semibold text-slate-200">
          {root}
        </div>
      </div>

      {children.length > 0 && (
        <>
          <div className="mx-auto h-8 w-px bg-slate-600" />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((node, index) => (
              <div
                key={`${node}-${index}`}
                className="relative rounded-lg border border-slate-700 bg-[#0a0a0a] shadow-sm px-4 py-3 text-center text-sm text-slate-200"
              >
                <div className="absolute -top-4 left-1/2 h-4 w-px bg-slate-600" />

                {node}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


function ComparisonDiagram({ visual }) {
  const nodes = visual?.nodes || [];

  const left = nodes[0] || "Concept A";
  const right = nodes[1] || "Concept B";

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-slate-700 bg-[#0a0a0a] shadow-sm p-5">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Concept A
        </p>

        <p className="text-sm leading-relaxed text-slate-200">
          {left}
        </p>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-900/50 shadow-sm p-5">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Concept B
        </p>

        <p className="text-sm leading-relaxed text-slate-200">
          {right}
        </p>
      </div>
    </div>
  );
}


function VisualExplanation({ visualType, visual }) {
  if (!visual || visualType === "NONE") {
    return null;
  }

  switch (visualType) {
    case "SEQUENCE":
      return <SequenceDiagram visual={visual} />;

    case "CAUSE_EFFECT":
      return <CauseEffectDiagram visual={visual} />;

    case "HIERARCHY":
      return <HierarchyDiagram visual={visual} />;

    case "COMPARISON":
      return <ComparisonDiagram visual={visual} />;

    default:
      return <SequenceDiagram visual={visual} />;
  }
}

export default VisualExplanation;