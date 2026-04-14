/* ================================================
   CROWNSTONE SECURITY - Main JavaScript
   Handles: Preloader, Navigation, Animations,
   Statistics Counter, Testimonial Slider,
   Enquiry Form, Scroll Effects, Particles
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ---- Preloader ----
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 1500);
    });

    // Fallback if load event already fired
    setTimeout(() => {
        preloader.classList.add('hidden');
    }, 3000);

    // ---- Load Contact Info from Admin Settings ----
    function loadSiteContactInfo() {
        try {
            const settings = JSON.parse(localStorage.getItem('crownstone_settings') || '{}');

            // Update phone
            const phoneEl = document.getElementById('sitePhone');
            if (phoneEl && settings.phone) {
                phoneEl.textContent = settings.phone;
            }

            // Show secondary phone if set
            const phone2El = document.getElementById('sitePhone2');
            if (phone2El && settings.phone2) {
                phone2El.textContent = settings.phone2;
                phone2El.style.display = 'block';
            }

            // Update email
            const emailEl = document.getElementById('siteEmail');
            if (emailEl && settings.contactEmail) {
                emailEl.textContent = settings.contactEmail;
            }

            // Update address
            const addressEl = document.getElementById('siteAddress');
            if (addressEl && (settings.address1 || settings.address2)) {
                const line1 = settings.address1 || '';
                const line2 = settings.address2 || '';
                addressEl.innerHTML = line2 ? `${line1}<br>${line2}` : line1;
            }
        } catch (e) {
            // Settings not available, use defaults
        }
    }
    loadSiteContactInfo();

    // ---- Floating Particles ----
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 8 + 's';
            particle.style.animationDuration = (6 + Math.random() * 6) + 's';
            const colors = ['#00d4ff', '#7b2ff7', '#3b82f6', '#00ff88'];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.width = (2 + Math.random() * 3) + 'px';
            particle.style.height = particle.style.width;
            particlesContainer.appendChild(particle);
        }
    }

    // ---- Navigation ----
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const allNavLinks = document.querySelectorAll('.nav-link');

    // Scroll effect for navbar
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    // Close mobile nav on link click
    allNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Active nav link on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY + 200;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            if (scrollPos >= top && scrollPos < top + height) {
                allNavLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });

    // ---- Stats Counter Animation ----
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    let statsAnimated = false;

    function animateStats() {
        if (statsAnimated) return;
        statsAnimated = true;

        statNumbers.forEach(el => {
            const target = parseInt(el.getAttribute('data-target'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                el.textContent = Math.round(current).toLocaleString();
            }, 16);
        });
    }

    // Trigger stats when hero is in view
    const heroSection = document.getElementById('home');
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(animateStats, 800);
            }
        });
    }, { threshold: 0.3 });

    if (heroSection) statsObserver.observe(heroSection);

    // ---- Testimonials Slider ----
    const track = document.getElementById('testimonialTrack');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('sliderDots');

    if (track) {
        const cards = track.querySelectorAll('.testimonial-card');
        let currentSlide = 0;
        const totalSlides = cards.length;

        // Create dots
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.classList.add('slider-dot');
            if (i === 0) dot.classList.add('active');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }

        const dots = dotsContainer.querySelectorAll('.slider-dot');

        function goToSlide(index) {
            currentSlide = index;
            track.style.transform = `translateX(-${currentSlide * 100}%)`;
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
            });
        }

        prevBtn.addEventListener('click', () => {
            goToSlide(currentSlide === 0 ? totalSlides - 1 : currentSlide - 1);
        });

        nextBtn.addEventListener('click', () => {
            goToSlide(currentSlide === totalSlides - 1 ? 0 : currentSlide + 1);
        });

        // Auto-slide
        let autoSlide = setInterval(() => {
            goToSlide(currentSlide === totalSlides - 1 ? 0 : currentSlide + 1);
        }, 5000);

        // Pause on hover
        track.addEventListener('mouseenter', () => clearInterval(autoSlide));
        track.addEventListener('mouseleave', () => {
            autoSlide = setInterval(() => {
                goToSlide(currentSlide === totalSlides - 1 ? 0 : currentSlide + 1);
            }, 5000);
        });
    }

    // ---- Enquiry Form ----
    const enquiryForm = document.getElementById('enquiryForm');
    const formSuccess = document.getElementById('formSuccess');
    const submitAnother = document.getElementById('submitAnother');

    if (enquiryForm) {
        enquiryForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Collect form data
            const formData = {
                id: generateId(),
                fullName: document.getElementById('fullName').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                email: document.getElementById('email').value.trim(),
                serviceType: document.getElementById('serviceType').value,
                propertyType: document.getElementById('propertyType').value || 'Not specified',
                address: document.getElementById('address').value.trim() || 'Not provided',
                message: document.getElementById('message').value.trim() || 'No additional details',
                status: 'new',
                date: new Date().toISOString(),
                read: false
            };

            // Validate
            if (!formData.fullName || !formData.phone || !formData.email || !formData.serviceType) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }

            // Save to localStorage
            saveEnquiry(formData);

            // Show success
            enquiryForm.style.display = 'none';
            formSuccess.style.display = 'block';

            // Show notification
            showNotification('Enquiry submitted successfully!', 'success');
        });
    }

    if (submitAnother) {
        submitAnother.addEventListener('click', () => {
            enquiryForm.reset();
            enquiryForm.style.display = 'block';
            formSuccess.style.display = 'none';
        });
    }

    // ---- LocalStorage Functions ----
    function saveEnquiry(enquiry) {
        const enquiries = getEnquiries();
        enquiries.unshift(enquiry);
        localStorage.setItem('crownstone_enquiries', JSON.stringify(enquiries));
    }

    function getEnquiries() {
        const data = localStorage.getItem('crownstone_enquiries');
        return data ? JSON.parse(data) : [];
    }

    function generateId() {
        return 'ENQ-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
    }

    // ---- Notification Toast ----
    function showNotification(message, type = 'success') {
        const existing = document.querySelector('.notification-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `notification-toast ${type}`;
        toast.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${type === 'success'
                    ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
                    : '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'}
            </svg>
            <span>${message}</span>
        `;

        // Styles
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%) translateY(100px)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 24px',
            background: type === 'success' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 71, 87, 0.15)',
            border: `1px solid ${type === 'success' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 71, 87, 0.3)'}`,
            borderRadius: '50px',
            color: type === 'success' ? '#00ff88' : '#ff4757',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9rem',
            fontWeight: '500',
            zIndex: '9999',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            transition: 'transform 0.4s ease',
        });

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(100px)';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // ---- Scroll Reveal ----
    const revealElements = document.querySelectorAll(
        '.service-card, .advantage-card, .gallery-item, .about-feature, .contact-item, .about-content, .about-visual'
    );

    revealElements.forEach(el => el.classList.add('reveal'));

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // ---- Back to Top ----
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.classList.toggle('visible', window.scrollY > 500);
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ---- Smooth scroll for all anchor links ----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

});
