// scripts.js

// Initialize Vue.js
const app = new Vue({
    el: '#app',
    data: {
        // This is just placeholder data to show you the structure.
        // You can expand on this or fetch it from an API.
        papers: [{
            title: "Paper Title",
            details: "Paper details..."
        }],
        awards: [
            { title: "Award 1", details: "Details for Award 1..." },
            { title: "Award 2", details: "Details for Award 2..." }
        ],
        // Add other data like career experiences, practical projects, etc...
    },
    methods: {
        // Potential methods for future interactivity
    }
});

// GSAP animations
window.addEventListener('load', () => {
    const sections = document.querySelectorAll('section');

    sections.forEach(section => {
        // Make sections initially invisible
        gsap.set(section, { autoAlpha: 0 });

        // Use Intersection Observer to determine when a section is in view
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Animate section into view
                    gsap.to(entry.target, { autoAlpha: 1, y: 0, duration: 1, ease: 'power2.out' });
                }
            });
        });

        // Apply Intersection Observer on each section
        io.observe(section);
    });

    document.querySelectorAll('nav ul li a').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent the default jump-to behavior
            const href = this.getAttribute('href'); // Get the target section's ID
    
            // Use GSAP to animate scrolling
            gsap.to(window, {
                duration: 1,
                scrollTo: {
                    y: href, // This will scroll to the element with the ID from href
                    offsetY: 100 // Adjust this if you want an offset from the top
                },
                ease: "power2.inOut" // Smooth easing function
            });
    
            // Optional: Update navigator links' active state
            document.querySelectorAll('nav ul li a').forEach(innerLink => innerLink.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
});

