import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useAgentAuth } from '../hooks/useAgentAuth';
import { useAppContext } from '../hooks/useAppContext';
import {
  EntityOption,
  EntityTypeId,
  V1Service,
  V1_ENTITY_OPTIONS,
  getServicesForEntity,
} from '../data/entityServiceCatalog';

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
  const { isAuthenticated } = useAuth();
  const { isAgentAuthenticated } = useAgentAuth();
  const { setPage, setSelectedServiceId, setFlow } = useAppContext();
  const isSignedIn = isAuthenticated || isAgentAuthenticated;
  const [activeEntity, setActiveEntity] = useState<EntityTypeId | 'all'>('all');
  const [query, setQuery] = useState('');

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

  const handleStartService = (service: V1Service) => {
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
      setPage(service.route);
      return;
    }

    setPage('login');
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
                    <div className="flex gap-2">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                        {services.filter(service => service.mode === 'digital').length} workflows
                      </span>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-ease-blue">
                        {services.filter(service => service.mode === 'expert').length} expert
                      </span>
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
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-black leading-6 text-slate-950">{service.name}</h3>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${service.mode === 'digital' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-ease-blue'}`}>
                          {service.mode === 'digital' ? 'Workflow' : 'Expert'}
                        </span>
                      </div>
                      <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">{service.description}</p>
                      <button
                        onClick={() => handleStartService(service)}
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
    </div>
  );
};

export default ServicesPage;
