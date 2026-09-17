import React, { useState } from 'react';
import { Save, CheckCircle2, RotateCcw } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';

export const AdminDesignSettings: React.FC = () => {
  const { design, updateDesign, resetDesignDefaults } = useStudio();

  const [formState, setFormState] = useState({ ...design });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // SAFE PREDEFINED FONTS LIST (MANDATORY REQUIREMENT: Safe predefined list)
  const safeHeadingFonts = [
    'Playfair Display',
    'Cormorant Garamond',
    'Montserrat',
    'Poppins',
    'Inter',
    'Plus Jakarta Sans'
  ];

  const safeBodyFonts = [
    'Plus Jakarta Sans',
    'Inter',
    'Poppins',
    'Montserrat'
  ];

  const safeRadiusOptions = [
    { label: 'Sharp Luxury (4px)', val: '4px' },
    { label: 'Modern Studio (8px)', val: '8px' },
    { label: 'Soft Contours (12px)', val: '12px' },
    { label: 'Pill Round (16px)', val: '16px' }
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDesign(formState);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset design settings to studio original gold-dark theme?')) return;
    await resetDesignDefaults();
    alert('Design reset to default.');
  };

  return (
    <div id="admin-design-settings-page" className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading" style={{ color: design.headingColor }}>
            Visual Identity &amp; Styling Engine
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Safely customize studio palette, luxury accents, typography, and buttons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded text-xs font-semibold uppercase tracking-wider border flex items-center gap-2 hover:bg-white/5"
            style={{ borderColor: design.borderColor, color: design.headingColor }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Design changes saved and applied across the entire public studio website!</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* Color Palette Section */}
        <div
          className="p-6 sm:p-8 rounded-2xl border space-y-6"
          style={{
            backgroundColor: design.surfaceColor,
            borderColor: design.borderColor,
          }}
        >
          <h2 className="text-lg font-bold font-heading border-b pb-3" style={{ color: design.headingColor, borderColor: design.borderColor }}>
            Color Palette &amp; Contrast
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Accent Color */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-neutral-400">
                Accent / Gold Tone
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formState.accentColor}
                  onChange={(e) => setFormState({ ...formState, accentColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={formState.accentColor}
                  onChange={(e) => setFormState({ ...formState, accentColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs rounded bg-black/40 border text-white font-mono"
                  style={{ borderColor: design.borderColor }}
                />
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-neutral-400">
                Atmosphere Background
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formState.backgroundColor}
                  onChange={(e) => setFormState({ ...formState, backgroundColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={formState.backgroundColor}
                  onChange={(e) => setFormState({ ...formState, backgroundColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs rounded bg-black/40 border text-white font-mono"
                  style={{ borderColor: design.borderColor }}
                />
              </div>
            </div>

            {/* Surface Card Color */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-neutral-400">
                Container Surface
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formState.surfaceColor}
                  onChange={(e) => setFormState({ ...formState, surfaceColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={formState.surfaceColor}
                  onChange={(e) => setFormState({ ...formState, surfaceColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs rounded bg-black/40 border text-white font-mono"
                  style={{ borderColor: design.borderColor }}
                />
              </div>
            </div>

            {/* Button Color */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-neutral-400">
                Primary Button Fill
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formState.buttonColor}
                  onChange={(e) => setFormState({ ...formState, buttonColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={formState.buttonColor}
                  onChange={(e) => setFormState({ ...formState, buttonColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs rounded bg-black/40 border text-white font-mono"
                  style={{ borderColor: design.borderColor }}
                />
              </div>
            </div>

            {/* Heading Color */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-neutral-400">
                Headings Text
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formState.headingColor}
                  onChange={(e) => setFormState({ ...formState, headingColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={formState.headingColor}
                  onChange={(e) => setFormState({ ...formState, headingColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs rounded bg-black/40 border text-white font-mono"
                  style={{ borderColor: design.borderColor }}
                />
              </div>
            </div>

            {/* Body Text Color */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-neutral-400">
                Body Descriptions
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formState.bodyTextColor}
                  onChange={(e) => setFormState({ ...formState, bodyTextColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={formState.bodyTextColor}
                  onChange={(e) => setFormState({ ...formState, bodyTextColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs rounded bg-black/40 border text-white font-mono"
                  style={{ borderColor: design.borderColor }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography & Geometries */}
        <div
          className="p-6 sm:p-8 rounded-2xl border space-y-6"
          style={{
            backgroundColor: design.surfaceColor,
            borderColor: design.borderColor,
          }}
        >
          <h2 className="text-lg font-bold font-heading border-b pb-3" style={{ color: design.headingColor, borderColor: design.borderColor }}>
            Safe Typography &amp; Curvature
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-neutral-400">
                Heading Font Family
              </label>
              <select
                value={formState.headingFont}
                onChange={(e) => setFormState({ ...formState, headingFont: e.target.value })}
                className="w-full px-3 py-2.5 text-xs rounded bg-black/40 border text-white focus:outline-none"
                style={{ borderColor: design.borderColor }}
              >
                {safeHeadingFonts.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-neutral-400">
                Body Font Family
              </label>
              <select
                value={formState.bodyFont}
                onChange={(e) => setFormState({ ...formState, bodyFont: e.target.value })}
                className="w-full px-3 py-2.5 text-xs rounded bg-black/40 border text-white focus:outline-none"
                style={{ borderColor: design.borderColor }}
              >
                {safeBodyFonts.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-neutral-400">
                Card &amp; Button Radius
              </label>
              <select
                value={formState.borderRadius}
                onChange={(e) => setFormState({ ...formState, borderRadius: e.target.value })}
                className="w-full px-3 py-2.5 text-xs rounded bg-black/40 border text-white focus:outline-none"
                style={{ borderColor: design.borderColor }}
              >
                {safeRadiusOptions.map((opt) => (
                  <option key={opt.val} value={opt.val}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live Preview Strip */}
        <div
          className="p-6 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{
            backgroundColor: formState.surfaceColor,
            borderColor: formState.borderColor,
          }}
        >
          <div>
            <span
              className="text-lg font-bold block"
              style={{ color: formState.headingColor, fontFamily: `'${formState.headingFont}', serif` }}
            >
              1 by 2 Studio Live Element Preview
            </span>
            <span
              className="text-xs"
              style={{ color: formState.bodyTextColor, fontFamily: `'${formState.bodyFont}', sans-serif` }}
            >
              This is how headline and subtitle pairing responds with the selected accent.
            </span>
          </div>

          <button
            type="button"
            className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: formState.buttonColor,
              color: '#0a0d14',
              borderRadius: formState.borderRadius,
            }}
          >
            Sample Button
          </button>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            id="admin-save-design-btn"
            className="px-8 py-3.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xl transition-transform hover:scale-105"
            style={{
              backgroundColor: design.buttonColor,
              color: '#0a0d14',
            }}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
