import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useAgentAuth } from '../hooks/useAgentAuth';
import { useAppContext } from '../hooks/useAppContext';
import { useClientManager } from '../hooks/useProfile';
import {
  EntityOption,
  EntityTypeId,
  V1Service,
  V1_ENTITY_OPTIONS,
  getEntityLabel,
  getServicesForEntity,
} from '../data/entityServiceCatalog';
import { createProject } from '../lib/projects';

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const entityStats: Record<EntityTypeId, { accent: string; short: string }> = {
  individual: { accent: 'from-blue-500 to-cyan-300', short: 'Personal tax workflows' },
  proprietorship: { accent: 'from-emerald-500 to-lime-300', short: 'Local business compliance' },
  partnership: { accent: 'from-orange-500 to-amber-300', short: 'Firm operations layer' },
  llp: { accent: 'from-violet-500 to-fuchsia-300', short: 'LLP compliance stack' },
  private_limited: { accent: 'from-indigo-500 to-blue-300', short: 'Company command center' },
  huf: { accent: 'from-slate-600 to-blue-300', short: 'Family tax workspace' },
};

const ServicesPage: React.FC = () => {
  const { isAuthenticated, user, switchEntity } = useAuth();
  const { isAgentAuthenticated } = useAgentAuth();
  const { setPage, setSelectedClientId, setSelectedProfileId, setSelectedServiceId, setFlow } = useAppContext();
  const { findClientsForUser } = useClientManager();
  const isSignedIn = isAuthenticated || isAgentAuthenticated;
  const [activeEntity, setActiveEntity] = useState<EntityTypeId | 'all'>('all');
  const [query, setQuery] = useState('');
  const [pendingLaunch, setPendingLaunch] = useState<{ service: V1Service; entity: EntityOption } | null>(null);
  const [selectedLaunchEntityId, setSelectedLaunchEntityId] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectCreationError, setProjectCreationError] = useState('');
  const userEntities = user ? findClientsForUser(user) : [];

  const allServiceGroups = useMemo<Array<{ entity: EntityOption; services: V1Service[] }>>(() => (
    V1_ENTITY_OPTIONS.map(entity => ({
      entity,
      services: getServicesForEntity(entity.id),
    }))
  ), []);

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allServiceGroups
      .filter(group => activeEntity === 'all' || group.entity.id === activeEntity)
      .map(group => ({
        ...group,
        services: group.services.filter(service => {
          const matchesQuery = !normalizedQuery
            || service.name.toLowerCase().includes(normalizedQuery)
            || service.description.toLowerCase().includes(normalizedQuery)
            || group.entity.name.toLowerCase().includes(normalizedQuery);
          return matchesQuery;
        }),
      }))
      .filter(group => group.services.length > 0);
  }, [activeEntity, allServiceGroups, query]);

  const launchEntityOptions = pendingLaunch
    ? userEntities.filter(entity => entity.entityType === pendingLaunch.entity.id)
    : [];

  const handleStartService = (service: V1Service, entity: EntityOption) => {
    if (service.route === 'contact') {
      setPage('contact');
      return;
    }

    setSelectedServiceId(service.key);

    if (!isSignedIn) {
      setPage('login');
      return;
    }

    if (isAgentAuthenticated) {
      setFlow('service');
      setPage('client-list');
      return;
    }

    if (isAuthenticated) {
      const matchingEntities = userEntities.filter(clientEntity => clientEntity.entityType === entity.id);
      setPendingLaunch({ service, entity });
      setSelectedLaunchEntityId(matchingEntities[0]?.id || '');
      setProjectCreationError('');
      return;
    }

    setPage('login');
  };

  const closeProjectLauncher = () => {
    if (isCreatingProject) return;
    setPendingLaunch(null);
    setSelectedLaunchEntityId('');
    setProjectCreationError('');
  };

  const handleConfirmProjectLaunch = async () => {
    if (!pendingLaunch) return;

    if (!user?.firebaseUid) {
      setProjectCreationError('Please continue with Google login so this project can be linked to your Firebase account.');
      return;
    }

    const selectedEntity = launchEntityOptions.find(entity => entity.id === selectedLaunchEntityId);

    if (!selectedEntity) {
      setProjectCreationError('Please select or create an entity before starting this service.');
      return;
    }

    setIsCreatingProject(true);
    setProjectCreationError('');

    try {
      await createProject({
        userId: user.firebaseUid,
        entityId: selectedEntity.id,
        entityName: selectedEntity.name,
        entityType: getEntityLabel(selectedEntity.entityType),
        service: pendingLaunch.service.name,
      });

      switchEntity(selectedEntity.id);
      setSelectedClientId(selectedEntity.id);
      setSelectedProfileId(null);
      setSelectedServiceId(pendingLaunch.service.key);
      setPendingLaunch(null);
      setPage(pendingLaunch.service.route);
    } catch (error: any) {
      setProjectCreationError(error?.message || 'Unable to create project. Please try again.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const getButtonLabel = (service: V1Service) => {
    if (service.route === 'contact') return 'Talk to Expert';
    if (!isSignedIn) return 'Login to Start';
    if (isAgentAuthenticated) return 'Select Client';
    return 'Get Started';
  };

  return (
    <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="glass-card overflow-hidden">
          <div className="mesh-surface relative p-6 text-white md:p-8">
            <div className="absolute right-10 top-10 hidden h-32 w-32 rounded-full border border-white/10 bg-white/10 blur-sm md:block" />
            <div className="max-w-4xl">
              <button onClick={() => setPage('home')} className="mb-5 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-50 transition hover:bg-white/20">
                Back to Home
              </button>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">Entity-wise Service OS</p>
              <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-6xl">Every compliance workflow, mapped by entity</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100 md:text-base">
                Explore the full Chartered Ease catalog across individuals, proprietorships, firms, LLPs, companies and HUFs.
              </p>
            </div>
          </div>
        </section>

        <section className="glass-card p-4 md:p-5">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-400"
              placeholder="Search GST, ROC, payroll, trademark, HUF, ITR..."
            />
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveEntity('all')}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${activeEntity === 'all' ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/20' : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-ease-blue'}`}
            >
              All Entities
            </button>
            {V1_ENTITY_OPTIONS.map(entity => (
              <button
                key={entity.id}
                onClick={() => setActiveEntity(entity.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${activeEntity === entity.id ? 'bg-ease-blue text-white shadow-lg shadow-ease-blue/20' : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-ease-blue'}`}
              >
                {entity.name}
              </button>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          {filteredGroups.map(({ entity, services }) => {
            const stats = entityStats[entity.id];

            return (
              <motion.section
                key={entity.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card overflow-hidden"
              >
                <div className="border-b border-slate-100 bg-white/70 p-5 md:p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <span className={`mt-1 h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br ${stats.accent} shadow-lg`} />
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">{stats.short}</p>
                        <h2 className="mt-1 text-2xl font-black text-slate-950">{entity.name}</h2>
                        <p className="mt-1 text-sm text-slate-500">{services.length} matching services available</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6 xl:grid-cols-3">
                  {services.map((service, index) => (
                    <motion.article
                      key={service.key}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.025 }}
                      whileHover={{ y: -5 }}
                      className="group flex min-h-[230px] flex-col rounded-[1.35rem] border border-slate-100 bg-white p-5 shadow-sm transition hover:border-ease-electric/30 hover:shadow-2xl"
                    >
                      <h3 className="text-lg font-black leading-6 text-slate-950">{service.name}</h3>
                      <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">{service.description}</p>
                      <button
                        onClick={() => handleStartService(service, entity)}
                        className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 ${service.route === 'contact' ? 'bg-ease-blue shadow-ease-blue/20 hover:bg-ease-electric' : 'bg-ease-green shadow-emerald-700/20 hover:bg-emerald-600'}`}
                      >
                        {getButtonLabel(service)}
                        <ArrowIcon />
                      </button>
                    </motion.article>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>

        {filteredGroups.length === 0 && (
          <div className="glass-card p-10 text-center">
            <p className="text-xl font-black text-slate-950">No services match this search</p>
            <p className="mt-2 text-sm text-slate-500">Try a different keyword or switch back to All Entities.</p>
          </div>
        )}
      </div>

      {pendingLaunch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button aria-label="Close project launcher" onClick={closeProjectLauncher} className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-2xl shadow-slate-900/25"
          >
            <div className="mesh-surface p-6 text-white">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">Create project</p>
              <h2 className="mt-2 text-2xl font-black">{pendingLaunch.service.name}</h2>
              <p className="mt-2 text-sm leading-6 text-blue-100">Choose the {pendingLaunch.entity.name} entity for this service. We will create a Firestore project before opening the workflow.</p>
            </div>

            <div className="space-y-5 bg-ease-bg p-6">
              {launchEntityOptions.length > 0 ? (
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-400">Entity</span>
                  <select
                    value={selectedLaunchEntityId}
                    onChange={(event) => setSelectedLaunchEntityId(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm outline-none transition focus:border-ease-electric focus:ring-4 focus:ring-blue-100"
                  >
                    {launchEntityOptions.map(entity => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name} - {getEntityLabel(entity.entityType)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5 text-center">
                  <p className="font-black text-slate-950">No {pendingLaunch.entity.name} entity found</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Create the entity first, then start this service again.</p>
                  <button onClick={() => setPage('entity-onboarding')} className="blue-glow-button mt-4 px-5 py-2.5 text-sm">Create Entity</button>
                </div>
              )}

              <div className="rounded-3xl border border-slate-100 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Project status</p>
                    <p className="mt-1 font-black text-slate-950">Pending</p>
                  </div>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">Firestore</span>
                </div>
              </div>

              {projectCreationError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{projectCreationError}</div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button onClick={closeProjectLauncher} disabled={isCreatingProject} className="soft-button flex-1 px-5 py-3 text-sm disabled:opacity-50">
                  Cancel
                </button>
                <button
                  onClick={handleConfirmProjectLaunch}
                  disabled={isCreatingProject || launchEntityOptions.length === 0}
                  className="blue-glow-button flex-1 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreatingProject ? 'Creating Project...' : 'Create Project & Continue'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
