import { useState } from 'react';
import RecipeCompositionPanel from '../components/RecipeCompositionPanel.jsx';
import IngredientPricesPanel from '../components/IngredientPricesPanel.jsx';
import ClStatusSettingsPanel from '../components/ClStatusSettingsPanel.jsx';

const TABS = [
  { id: 'recipe', label: 'Recipe' },
  { id: 'prices', label: 'Price per kg' },
  { id: 'cl-status', label: 'Continuous Line Status' },
];

export default function RecipeSettings() {
  const [activeTab, setActiveTab] = useState('recipe');

  return (
    <>
      <div className="subtitle">
        Recipe targets, ingredient prices, and continuous line status for the dashboard
      </div>

      <div className="panel">
        <div className="settings-tabs" role="tablist" aria-label="Settings sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? 'tab-btn active' : 'tab-btn'}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="settings-tab-panel" role="tabpanel">
          {activeTab === 'recipe' && <RecipeCompositionPanel />}
          {activeTab === 'prices' && <IngredientPricesPanel />}
          {activeTab === 'cl-status' && <ClStatusSettingsPanel />}
        </div>
      </div>
    </>
  );
}
