class ExperienceRenderer {
  constructor(container, destinationService){
    this.container = container;
    this.destinationService = destinationService;
  }

  render(experiences, selectedIds, hasDestinations){
    if(!hasDestinations){
      this.container.innerHTML = '<div class="destination-empty">Select one or more destinations to discover matching experiences.</div>';
      return;
    }
    if(!experiences.length){
      this.container.innerHTML = '<div class="destination-empty">No experiences match these destinations yet.</div>';
      return;
    }

    const destinations = new Map(this.destinationService.getAll().map(item => [item.id, item.name]));
    this.container.innerHTML = experiences.map((experience, index) => {
      const destinationNames = experience.destinationIds.map(id => destinations.get(id)).filter(Boolean);
      const destinationLabel = escapeHtml(destinationNames.join(' · '));
      const name = escapeHtml(experience.name);
      const metadata = [
        experience.duration && ['⏱','Duration',experience.duration],
        experience.difficulty && ['★','Difficulty',experience.difficulty],
        experience.bestSeason && ['📅','Best season',experience.bestSeason],
        ['◇','Experience style',experience.category]
      ].filter(Boolean).slice(0,3);
      return `
        <button type="button"
          class="experience-card pick-card filter-enter ${selectedIds.has(experience.id)?'selected':''}"
          data-type="experiences"
          data-id="${experience.id}"
          style="--stagger:${Math.min(index, 11) * 42}ms"
          aria-pressed="${selectedIds.has(experience.id)}">
          <span class="experience-media">
            <img src="${escapeHtml(experience.heroImage)}" alt="${name} in ${escapeHtml(destinationNames.join(', '))}" loading="lazy" decoding="async">
            <span class="experience-shade"></span>
            <span class="experience-topline">
              <span class="experience-priority priority-${experience.priority.toLowerCase().replace(/\s+/g,'-')}">${escapeHtml(experience.priority)}</span>
              <span class="check-dot">${iconSvg('i-check')}</span>
            </span>
            <span class="experience-badges">
              <span>${destinationLabel}</span>
              <span>${escapeHtml(experience.category)}</span>
            </span>
          </span>
          <span class="experience-content">
            <span class="experience-title">${name}</span>
            <span class="experience-description">${escapeHtml(experience.shortDescription)}</span>
            <span class="experience-meta" aria-label="Experience details">${metadata.map(([icon,label,value])=>`<span title="${label}"><b aria-hidden="true">${icon}</b>${escapeHtml(value)}</span>`).join('')}</span>
          </span>
        </button>`;
    }).join('');
  }
}
