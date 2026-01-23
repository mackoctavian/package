export const LogoConfiguration = () => {
  return (
    <>
      <h3 className=" text-xl font-semibold mt-8 text-black">Logo</h3>
      <div className="p-6 rounded-md border mt-4 border-dark_border border-opacity-60 space-y-4">
        <p className="text-base font-medium text-muted text-opacity-60">
          Upload or update both the light + dark logos from{" "}
          <span className="font-semibold">Admin → Homepage → Site Branding</span>. Changes propagate instantly to the header, footer,
          authentication flows, and generated tickets.
        </p>
        <p className="text-base font-medium text-muted text-opacity-60">
          The <code>useBranding</code> hook centralises the active logo URLs and is consumed in{" "}
          <span className="font-semibold text-base overflow-x-auto block">
            src/components/Layout/Header/Logo/index.tsx
          </span>
          for reuse everywhere else.
        </p>
        <div className="py-4 px-3 rounded-md bg-black mt-4">
          <div className="text-sm text-white/60 space-y-1">
            <p>&#x3C;Logo variant=&#x22;inverse&#x22; width=&#x7B;140&#x7D; height=&#x7B;40&#x7D; /&#x3E;</p>
            <p className="text-xs text-white/40">Primary + inverse assets are stored in site settings.</p>
          </div>
        </div>
      </div>
    </>
  );
};
