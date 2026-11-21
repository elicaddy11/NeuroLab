import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "../icons";
import { NAV_SECTIONS, type SectionId } from "../../config/navigation";
import { searchNeuroLab, type SearchResult } from "../../config/searchIndex";
import "./Toolbar.css";

interface ToolbarProps {
  active: SectionId;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSelectSearchResult: (result: SearchResult) => void;
}

export function Toolbar({
  active,
  searchQuery,
  onSearchQueryChange,
  onSelectSearchResult,
}: ToolbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const results = searchNeuroLab(searchQuery);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const section = NAV_SECTIONS.find((item) => item.id === active);
  if (!section) {
    return null;
  }
  return (
    <header className="toolbar">
      <div className="context">
        <span className="contextSection">{section.label}</span>
        <span className="contextDivider">/</span>
        <span className="contextSub">{section.description}</span>
      </div>

      <div className="searchWrap">
        <SearchIcon size={15} className="searchIcon" />
        <input
          ref={searchInputRef}
          className="searchInput"
          type="text"
          placeholder="Search anatomy, systems, and concepts…"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setSearchFocused(false);
              searchInputRef.current?.blur();
            } else if (event.key === "Enter" && results[0]) {
              onSelectSearchResult(results[0]);
              setSearchFocused(false);
            }
          }}
          aria-label="Search all NeuroLab anatomy, systems, and concepts"
          aria-autocomplete="list"
          aria-expanded={searchFocused && searchQuery.trim().length > 0}
          aria-controls="globalSearchResults"
        />
        <span className="searchHint">Ctrl/⌘K</span>
        {searchFocused && searchQuery.trim() && (
          <div className="searchResults" id="globalSearchResults" role="listbox" aria-label="Global search results">
            {results.length > 0 ? results.map((result) => (
              <button
                type="button"
                key={result.id}
                className="searchResult"
                role="option"
                aria-selected="false"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelectSearchResult(result);
                  setSearchFocused(false);
                }}
              >
                <span className="searchResultCopy">
                  <strong>{result.title}</strong>
                  <span>{result.description}</span>
                </span>
                <span className="searchResultCategory">{result.category}</span>
              </button>
            )) : (
              <p className="searchNoResults">No anatomy, systems, or concepts match.</p>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
