const StatCard = ({ label, value, detail, icon: Icon }) => {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {detail}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf3f8] text-[#163b65]">
          <Icon size={21} strokeWidth={1.8} />
        </div>
      </div>
    </article>
  );
};

export default StatCard;