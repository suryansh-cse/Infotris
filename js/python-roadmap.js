// ==========================================
// OPENLEARN ROADMAP V2
// Premium interactions + zoom-ready
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const roadmap = document.querySelector(".roadmap-container");
    const nodes = document.querySelectorAll(".roadmap-node");

    // ==========================================
    // NODE ANIMATION ON LOAD
    // ==========================================

    nodes.forEach((node, index) => {

        node.style.opacity = "0";
        node.style.transform =
            "translateX(-50%) translateY(40px)";

        setTimeout(() => {

            node.style.transition =
                "all 0.6s cubic-bezier(.2,.8,.2,1)";

            node.style.opacity = "1";
            node.style.transform =
                "translateX(-50%) translateY(0)";

        }, index * 120);

    });

    // ==========================================
    // PREMIUM HOVER PARALLAX
    // ==========================================

    nodes.forEach(node => {

        node.addEventListener("mousemove", (e) => {

            const rect =
                node.getBoundingClientRect();

            const x =
                e.clientX - rect.left;

            const y =
                e.clientY - rect.top;

            const centerX =
                rect.width / 2;

            const centerY =
                rect.height / 2;

            const rotateX =
                (y - centerY) / 18;

            const rotateY =
                (centerX - x) / 18;

            node.style.transform =
                `
                translateX(-50%)
                perspective(1000px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                translateY(-10px)
                `;
        });

        node.addEventListener("mouseleave", () => {

            node.style.transform =
                "translateX(-50%) rotateX(0) rotateY(0)";
        });

    });

    // ==========================================
    // CURRENT LESSON AUTO HIGHLIGHT
    // ==========================================

    const currentPage =
        window.location.pathname
        .split("/")
        .pop()
        .replace(/\.html$/, "");

    nodes.forEach(node => {

        const href = node.getAttribute("href");
        if (
            node.tagName === "A" &&
            href &&
            href.replace(/\.html$/, "") === currentPage
        ) {

            node.classList.add("current");

            node.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        }

    });

    // ==========================================
    // ROADMAP ZOOM SYSTEM
    // (trackpad ready for future)
    // ==========================================

    let scale = 1;
    const minScale = 0.8;
    const maxScale = 1.6;

    roadmap.addEventListener("wheel", (e) => {

        if (!e.ctrlKey) return;

        e.preventDefault();

        if (e.deltaY < 0) {
            scale += 0.08;
        } else {
            scale -= 0.08;
        }

        scale =
            Math.min(
                Math.max(scale, minScale),
                maxScale
            );

        roadmap.style.transform =
            `scale(${scale})`;

        roadmap.style.transformOrigin =
            "top center";

    }, { passive: false });

    // ==========================================
    // NODE CLICK RIPPLE EFFECT
    // ==========================================

    nodes.forEach(node => {

        node.addEventListener("click", function (e) {

            const ripple =
                document.createElement("span");

            ripple.classList.add(
                "click-ripple"
            );

            const rect =
                this.getBoundingClientRect();

            ripple.style.left =
                `${e.clientX - rect.left}px`;

            ripple.style.top =
                `${e.clientY - rect.top}px`;

            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 700);
        });

    });

    // ==========================================
    // EXPANDABLE MODULES (future ready)
    // ==========================================

    const moduleNodes =
        document.querySelectorAll(
            ".module-node"
        );

    moduleNodes.forEach(module => {

        module.addEventListener("click", () => {

            module.classList.toggle(
                "expanded"
            );

        });

    });

});