        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    // Calculate offset for fixed header
                    const headerOffset = document.querySelector('header').offsetHeight;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                    
                    // Update active link state
                    document.querySelectorAll('nav a').forEach(link => link.classList.remove('active'));
                    this.classList.add('active');
                }
            });
        });

        // Active link highlighting on scroll
        const sections = document.querySelectorAll('section');
        // Moved navLinks declaration to a more accessible scope
        const navLinks = document.querySelectorAll('nav a.nav-link'); 
        window.onscroll = () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop - document.querySelector('header').offsetHeight - 50; // Adjust offset as needed
                if (pageYOffset >= sectionTop) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        };


        // Chart data and configuration
        const cac40Data = {
            labels: Array.from({length: 10}, (_, i) => `Année ${i+1}`),
            datasets: [{
                label: 'Performance CAC 40 (Index 100)',
                data: [100, 105, 110, 108, 115, 122, 128, 135, 140, 150], // Example data showing ~6% avg growth with some volatility
                borderColor: '#4FD1C5',
                backgroundColor: 'rgba(79, 209, 197, 0.1)',
                fill: true,
                tension: 0.1
            }]
        };

        const esgData = {
            labels: Array.from({length: 5}, (_, i) => `Année ${i+1}`),
            datasets: [{
                label: 'Performance Indice ESG (Index 100)',
                data: [100, 108, 118, 125, 140], // Example data showing ~8% avg growth
                borderColor: '#A0AEC0',
                backgroundColor: 'rgba(160, 174, 192, 0.1)',
                fill: true,
                tension: 0.1
            }]
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: { color: '#4A5568' } // slate-700
                },
                x: {
                    ticks: { color: '#4A5568' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#2D3748' } // slate-800
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(0);
                            }
                            return label;
                        }
                    }
                }
            }
        };
        
        let scenarioChartInstance;

        function createChart(ctx, type, data, options) {
            return new Chart(ctx, { type, data, options });
        }
        
        const scenarioDetailsContent = {
            favorable: {
                title: "Scénario Favorable (Marché Haussier)",
                description: "Les sous-jacents (CAC 40 et/ou Indice ESG) dépassent leurs seuils d'activation. Le rendement annuel combiné peut atteindre <strong>jusqu'à 9%</strong> (3% obligataire + 6% optionnel).",
                capitalInitial: 100000,
                capitalNetInvesti: 98000,
                capitalFinalEstime: 121460,
                plusValueNette: 21460,
                rendementAnnuel: "Jusqu'à 9%"
            },
            neutre: {
                title: "Scénario Neutre (Marché Stable)",
                description: "Les sous-jacents n'atteignent pas leurs seuils. Seul le rendement de la brique obligataire (<strong>3% par an</strong>) est perçu.",
                capitalInitial: 100000,
                capitalNetInvesti: 98000,
                capitalFinalEstime: 103820,
                plusValueNette: 3820,
                rendementAnnuel: "3%"
            },
            defavorable: {
                title: "Scénario Défavorable (Marché Baissier)",
                description: "Les sous-jacents performent mal. Le rendement de la brique obligataire (<strong>3% par an</strong>) est maintenu. La protection du capital à 90% est active.",
                capitalInitial: 100000,
                capitalNetInvesti: 98000,
                capitalFinalEstime: 103820, // Same as neutral due to 3% bond yield covering fees and providing small gain
                plusValueNette: 3820,      // Minimum guaranteed return from bond part after fees
                rendementAnnuel: "3% (via brique obligataire)"
            }
        };

        function showScenario(scenarioType) {
            const details = scenarioDetailsContent[scenarioType];
            const container = document.getElementById('scenarioDetails');
            container.innerHTML = `
                <h4 class="text-lg font-semibold text-teal-600 mb-2">${details.title}</h4>
                <p class="mb-3">${details.description}</p>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Capital initial :</strong></div><div>${details.capitalInitial.toLocaleString('fr-FR')} €</div>
                    <div><strong>Capital net investi (après frais d'entrée) :</strong></div><div>${details.capitalNetInvesti.toLocaleString('fr-FR')} €</div>
                    <div><strong>Rendement annuel brut estimé :</strong></div><div>${details.rendementAnnuel}</div>
                    <div><strong>Capital final estimé (après 3 ans et frais de gestion) :</strong></div><div><strong>${details.capitalFinalEstime.toLocaleString('fr-FR')} €</strong></div>
                    <div><strong>Plus-value nette estimée :</strong></div><div>${details.plusValueNette.toLocaleString('fr-FR')} €</div>
                </div>
            `;

            // Update scenario chart
            const scenarioChartCtx = document.getElementById('scenarioChart').getContext('2d');
            const scenarioChartData = {
                labels: ['Capital Initial', 'Capital Net Investi', 'Capital Final Estimé (3 ans)'],
                datasets: [{
                    label: `Capital (${details.title})`,
                    data: [details.capitalInitial, details.capitalNetInvesti, details.capitalFinalEstime],
                    backgroundColor: ['#A0AEC0', '#718096', '#4FD1C5'], // Gray, Darker Gray, Teal
                    borderColor: ['#A0AEC0', '#718096', '#4FD1C5'],
                    borderWidth: 1
                }]
            };
             if(scenarioChartInstance) {
                scenarioChartInstance.destroy();
            }
            scenarioChartInstance = createChart(scenarioChartCtx, 'bar', scenarioChartData, {
                responsive: true,
                maintainAspectRatio: false,
                 scales: {
                    y: { beginAtZero: true, ticks: { color: '#4A5568', callback: function(value) { return value.toLocaleString('fr-FR') + ' €';} } },
                    x: { ticks: { color: '#4A5568' } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y.toLocaleString('fr-FR') + ' €';
                            }
                        }
                    }
                }
            });
            
            // Update active button
            document.querySelectorAll('#sous-jacents-scenarios .btn-secondary').forEach(btn => btn.classList.remove('active'));
            // Corrected ID from btnFavoravorable to btnFavorable
            document.getElementById(`btn${scenarioType.charAt(0).toUpperCase() + scenarioType.slice(1)}`).classList.add('active');

        }

        window.onload = function() {
            // Initialize charts
            const cac40Ctx = document.getElementById('cac40Chart').getContext('2d');
            createChart(cac40Ctx, 'line', cac40Data, chartOptions);

            const esgCtx = document.getElementById('esgChart').getContext('2d');
            createChart(esgCtx, 'line', esgData, chartOptions);
            
            // Show default scenario
            showScenario('favorable');
             // Set first nav link active by default
            if(navLinks.length > 0) {
                navLinks[0].classList.add('active');
            }
        ;
         const backToTopBtn = document.getElementById('backToTopBtn');

  // Cacher le bouton au chargement
  backToTopBtn.style.display = 'none';

  // Afficher / Cacher le bouton selon le scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 200) {
      backToTopBtn.style.display = 'flex';
    } else {
      backToTopBtn.style.display = 'none';
    }
  });

  // Remonter en haut de la page au clic
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
        };