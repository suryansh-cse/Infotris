document.addEventListener("DOMContentLoaded", () => {

    const searchInput = document.getElementById("course-search");
    const resultsBox = document.querySelector(".search-results");
    const searchButton = document.querySelector(".search-bar-button");
    if (!searchInput || !resultsBox) {
        console.error("Search elements not found.");
        return;
    }

    searchInput.addEventListener("input", function () {

        const query = this.value.trim().toLowerCase();

        resultsBox.innerHTML = "";

        if (query === "") {
            resultsBox.style.display = "none";
            return;
        }

        const results = INFOTRIS_INDEX.filter(item => {

            return (
                item.title.toLowerCase().includes(query) ||

                item.keywords.some(keyword =>
                    keyword.toLowerCase().includes(query)
                )
            );

        });

        if (results.length === 0) {

            resultsBox.innerHTML = `
                <div class="search-item no-result">
                    No results found
                </div>
            `;

        } else {

            results.forEach(item => {

                const div = document.createElement("div");

                div.className = "search-item";

                div.innerHTML = `

                <div class="search-content">
                
                    <strong>${item.title}</strong>
                
                    <small>${item.description}</small>
                
                </div>
                
                <span class="search-badge">
                
                    ${item.type}
                
                </span>
                
                `;

                div.addEventListener("click", () => {
                    window.location.href = item.url;
                });

                resultsBox.appendChild(div);

            });

        }

        resultsBox.style.display = "block";

    });

    document.addEventListener("click", function(e){

        if(!e.target.closest(".search-bar")){

            resultsBox.style.display="none";

        }

    });

    searchButton.addEventListener("click", () => {

        const query = searchInput.value.trim().toLowerCase();
    
        if(query === "") return;
    
        const firstResult = INFOTRIS_INDEX.find(item =>
    
            item.title.toLowerCase().includes(query) ||
    
            item.keywords.some(keyword =>
                keyword.toLowerCase().includes(query)
            )
    
        );
    
        if(firstResult){
    
            window.location.href = firstResult.url;
    
        }
    
    });

});

