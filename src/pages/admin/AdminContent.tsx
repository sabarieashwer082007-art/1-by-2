import React, { useState } from 'react';
import { Save, CheckCircle2, FileText, Image as ImageIcon, Eye } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { useToast } from '../../context/ToastContext';

export const AdminContent: React.FC = () => {
  const { content, updateContent, design } = useStudio();
  const { showSuccess, showError } = useToast();
  const [formContent, setFormContent] = useState({ ...content });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateContent(formContent);
      setSaved(true);
      showSuccess('Website content updated successfully.');
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      showError('Error updating content: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="admin-cms-content-page" className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading" style={{ color: design.headingColor }}>
            Website Content &amp; Copy CMS
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Edit all headlines, stories, philosophy, and hero visuals dynamically.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Website content updated successfully! Reflected instantly across public pages.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* 1. HERO SECTION */}
        <div
          className="p-6 sm:p-8 rounded-2xl border space-y-6"
          style={{
            backgroundColor: design.surfaceColor,
            borderColor: design.borderColor,
          }}
        >
          <h2 className="text-lg font-bold font-heading border-b pb-3" style={{ color: design.headingColor, borderColor: design.borderColor }}>
            Homepage Hero Section
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-neutral-400">
                Top Tagline Badge
              </label>
              <input
                type="text"
                value={formContent.hero.tagline}
                onChange={(e) => setFormContent({
                  ...formContent,
                  hero: { ...formContent.hero, tagline: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded bg-black/40 border text-white focus:outline-none"
                style={{ borderColor: design.borderColor }}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-neutral-400">
                Main Headline
              </label>
              <input
                type="text"
                value={formContent.hero.title}
                onChange={(e) => setFormContent({
                  ...formContent,
                  hero: { ...formContent.hero, title: e.target.value }
                })}
                className="w-full px-3 py-2 text-sm rounded bg-black/40 border text-white focus:outline-none"
                style={{ borderColor: design.borderColor }}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-neutral-400">
                Hero Subtitle / Description
              </label>
              <textarea
                rows={3}
                value={formContent.hero.subtitle}
                onChange={(e) => setFormContent({
                  ...formContent,
                  hero: { ...formContent.hero, subtitle: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded bg-black/40 border text-white focus:outline-none"
                style={{ borderColor: design.borderColor }}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-neutral-400">
                Hero Background Image URL
              </label>
              <input
                type="url"
                value={formContent.hero.bgImage}
                onChange={(e) => setFormContent({
                  ...formContent,
                  hero: { ...formContent.hero, bgImage: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded bg-black/40 border text-white focus:outline-none font-mono"
                style={{ borderColor: design.borderColor }}
              />
            </div>
          </div>
        </div>

        {/* 2. ABOUT & PHILOSOPHY */}
        <div
          className="p-6 sm:p-8 rounded-2xl border space-y-6"
          style={{
            backgroundColor: design.surfaceColor,
            borderColor: design.borderColor,
          }}
        >
          <h2 className="text-lg font-bold font-heading border-b pb-3" style={{ color: design.headingColor, borderColor: design.borderColor }}>
            About Studio &amp; Philosophy
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-neutral-400">
                The Studio Story
              </label>
              <textarea
                rows={4}
                value={formContent.about.story}
                onChange={(e) => setFormContent({
                  ...formContent,
                  about: { ...formContent.about, story: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded bg-black/40 border text-white focus:outline-none"
                style={{ borderColor: design.borderColor }}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-neutral-400">
                Studio Mission Statement
              </label>
              <textarea
                rows={3}
                value={formContent.about.mission}
                onChange={(e) => setFormContent({
                  ...formContent,
                  about: { ...formContent.about, mission: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded bg-black/40 border text-white focus:outline-none"
                style={{ borderColor: design.borderColor }}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-neutral-400">
                Photography Philosophy
              </label>
              <textarea
                rows={3}
                value={formContent.about.philosophy}
                onChange={(e) => setFormContent({
                  ...formContent,
                  about: { ...formContent.about, philosophy: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded bg-black/40 border text-white focus:outline-none"
                style={{ borderColor: design.borderColor }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-neutral-400">
                  Experience Years Stat
                </label>
                <input
                  type="text"
                  value={formContent.about.experienceYears}
                  onChange={(e) => setFormContent({
                    ...formContent,
                    about: { ...formContent.about, experienceYears: e.target.value }
                  })}
                  className="w-full px-3 py-2 text-xs rounded bg-black/40 border text-white focus:outline-none"
                  style={{ borderColor: design.borderColor }}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-neutral-400">
                  Commissions Completed
                </label>
                <input
                  type="text"
                  value={formContent.about.shootsCompleted}
                  onChange={(e) => setFormContent({
                    ...formContent,
                    about: { ...formContent.about, shootsCompleted: e.target.value }
                  })}
                  className="w-full px-3 py-2 text-xs rounded bg-black/40 border text-white focus:outline-none"
                  style={{ borderColor: design.borderColor }}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-neutral-400">
                  Happy Clients Stat
                </label>
                <input
                  type="text"
                  value={formContent.about.happyClients}
                  onChange={(e) => setFormContent({
                    ...formContent,
                    about: { ...formContent.about, happyClients: e.target.value }
                  })}
                  className="w-full px-3 py-2 text-xs rounded bg-black/40 border text-white focus:outline-none"
                  style={{ borderColor: design.borderColor }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            id="admin-save-content-btn"
            className="px-8 py-3.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xl transition-transform hover:scale-105"
            style={{
              backgroundColor: design.buttonColor,
              color: '#0a0d14',
            }}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing Updates...' : 'Publish Content Updates'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
