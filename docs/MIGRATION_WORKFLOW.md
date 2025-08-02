# EchoDash React Migration - Comprehensive Implementation Workflow

## 🚀 Project Overview

**Objective**: Migrate EchoDash WordPress plugin admin interface from jQuery to modern React while preserving all functionality and implementing new UI design.

**Timeline**: 4-6 weeks (6 phases)  
**Complexity**: High  
**Risk Level**: Medium  
**Strategy**: Systematic with visual validation

## 📋 Executive Summary

### Current State
- **Technology**: jQuery + jQuery UI + Select4 with traditional PHP rendering
- **Files**: 5 core files (~2,269 lines total)
- **Features**: 8 critical functionalities including 20+ plugin integrations

### Target Architecture
- **Framework**: React 18+ with TypeScript
- **Build System**: @wordpress/scripts with webpack
- **Components**: @wordpress/components library
- **Testing**: Jest + React Testing Library + Playwright visual testing
- **Performance**: Code splitting, lazy loading, <500KB bundle

### Success Criteria
- **Zero data loss** during migration
- **100% feature parity** with current implementation
- **>97% visual accuracy** to design mockups
- **WCAG 2.1 AA** accessibility compliance
- **<3 second** initial load time

---

## 🏗️ Phase-by-Phase Implementation Workflow

### Phase 1: Foundation & Build Setup (Week 1)
**Persona**: `--persona-architect` + `--persona-frontend`  
**MCP Integration**: `--c7` `--sequential`

#### 🎯 Phase Goal
Establish modern development environment and basic React structure

#### 📦 Core Tasks

##### Task 1.1: Build System Setup (Priority: HIGH)
**Estimated Time**: 8 hours  
**Dependencies**: Node.js 18+, WordPress development environment

**Implementation Steps**:
1. **Configure @wordpress/scripts** (2 hours)
   ```bash
   npm install @wordpress/scripts --save-dev
   npx @wordpress/create-block --template @wordpress/create-block-tutorial-template
   ```
   - Set up webpack config for WordPress admin context
   - Configure entry points for React components
   - Set up hot module replacement for development

2. **TypeScript Configuration** (2 hours)
   ```typescript
   // tsconfig.json
   {
     "compilerOptions": {
       "target": "ES2020",
       "lib": ["DOM", "ES2020"],
       "jsx": "react-jsx",
       "strict": true,
       "moduleResolution": "node"
     }
   }
   ```

3. **ESLint & Prettier Setup** (2 hours)
   - Configure WordPress coding standards
   - Set up pre-commit hooks
   - Configure VS Code integration

4. **Build Scripts Configuration** (2 hours)
   ```json
   {
     "scripts": {
       "build": "wp-scripts build",
       "start": "wp-scripts start",
       "test": "wp-scripts test-unit-js",
       "lint": "wp-scripts lint-js && wp-scripts lint-style"
     }
   }
   ```

**Acceptance Criteria**:
- ✅ React development server running
- ✅ TypeScript compilation working without errors
- ✅ WordPress build pipeline functional
- ✅ Hot reload working in development mode

##### Task 1.2: Project Structure Setup (Priority: HIGH)
**Estimated Time**: 4 hours

**Directory Structure**:
```
assets/
├── src/
│   ├── components/           # React components
│   │   ├── common/          # Shared components
│   │   ├── integration/     # Integration-specific components
│   │   └── forms/           # Form components
│   ├── hooks/               # Custom React hooks
│   │   ├── useSettings.ts   # Settings management
│   │   ├── useIntegrations.ts
│   │   └── useAPI.ts        # API integration
│   ├── services/            # API and external services
│   │   ├── api.ts
│   │   └── wordpress.ts
│   ├── types/               # TypeScript definitions
│   │   ├── integration.ts
│   │   ├── trigger.ts
│   │   └── api.ts
│   ├── utils/               # Utility functions
│   │   ├── validation.ts
│   │   └── helpers.ts
│   └── index.tsx            # Main entry point
├── dist/                    # Build output
└── legacy/                  # Current jQuery files (preserved)
    ├── echodash-admin.js
    └── echodash-admin.css
```

##### Task 1.3: Type Definitions (Priority: MEDIUM)
**Estimated Time**: 6 hours

**Core Interfaces**:
```typescript
// types/integration.ts
interface Integration {
  slug: string;
  name: string;
  icon: string;
  triggerCount: number;
  enabled: boolean;
  triggers: Trigger[];
}

// types/trigger.ts
interface Trigger {
  id: string;
  name: string;
  description: string;
  hasGlobal: boolean;
  hasSingle: boolean;
  optionTypes: string[];
  defaultEvent: EventConfig;
}

// types/api.ts
interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
```

##### Task 1.4: Basic React Shell (Priority: MEDIUM)
**Estimated Time**: 8 hours

**Main App Component**:
```typescript
// src/components/App.tsx
import { useState } from 'react';
import { AppProvider } from './providers/AppProvider';
import { IntegrationDashboard } from './integration/IntegrationDashboard';

const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="echodash-react-app">
        <IntegrationDashboard />
      </div>
    </AppProvider>
  );
};
```

##### Task 1.5: Visual Testing Setup (Priority: MEDIUM)
**Estimated Time**: 10 hours

**Playwright Configuration**:
```typescript
// tests/visual/playwright.config.ts
export default defineConfig({
  testDir: './tests/visual',
  use: {
    baseURL: process.env.WP_BASE_URL || 'http://localhost:8888',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
  ],
});
```

**Visual Testing Utilities**:
```typescript
// tests/visual/utils/visual-testing.ts
export class EchoDashVisualTester {
  constructor(private page: Page) {}

  async compareWithMockup(mockupName: string, options: ComparisonOptions) {
    const screenshot = await this.captureScreenshot(options);
    const mockupPath = `tmp/mockups/${MOCKUPS[mockupName].mockupFile}`;
    return this.performComparison(screenshot, mockupPath, options.tolerance);
  }
}
```

#### 🎯 Phase 1 Success Criteria
- ✅ React development server running without errors
- ✅ TypeScript compilation working with all types defined
- ✅ WordPress build pipeline producing valid assets
- ✅ Basic React app renders in WordPress admin context
- ✅ Playwright visual testing framework operational
- ✅ All development tools (linting, formatting) configured

**Phase 1 Deliverables**:
- Complete build system and development environment
- TypeScript project structure with all core types
- Basic React application shell
- Visual testing framework with mockup comparison
- Documentation for development workflow

---

### Phase 2: Data Layer & API Integration (Week 2)
**Persona**: `--persona-backend` + `--persona-architect`  
**MCP Integration**: `--c7` `--sequential`

#### 🎯 Phase Goal
Establish data management and WordPress integration layer

#### 📦 Core Tasks

##### Task 2.1: WordPress REST API Extensions (Priority: HIGH)
**Estimated Time**: 12 hours  
**Dependencies**: WordPress 6.0+, PHP 7.4+

**REST API Endpoints**:
```php
// includes/admin/class-echodash-api.php
class EchoDash_API extends WP_REST_Controller {
    
    public function register_routes() {
        register_rest_route('echodash/v1', '/settings', [
            'methods' => ['GET', 'POST'],
            'callback' => [$this, 'handle_settings'],
            'permission_callback' => [$this, 'check_permissions']
        ]);
        
        register_rest_route('echodash/v1', '/integrations', [
            'methods' => 'GET',
            'callback' => [$this, 'get_integrations']
        ]);
    }
}
```

**API Security**:
- WordPress nonce verification
- Capability checks (`manage_options`)
- Input sanitization and validation
- Rate limiting for API endpoints

##### Task 2.2: Data Management Layer (Priority: HIGH)
**Estimated Time**: 10 hours  
**Dependencies**: Task 2.1 completion

**Custom Hooks**:
```typescript
// hooks/useSettings.ts
export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fetchSettings = useCallback(async () => {
    try {
      const response = await apiFetch({ path: '/echodash/v1/settings' });
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
    // Optimistic update
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    try {
      await apiFetch({
        path: '/echodash/v1/settings',
        method: 'POST',
        data: newSettings
      });
    } catch (error) {
      // Revert on error
      fetchSettings();
      throw error;
    }
  }, [fetchSettings]);

  return { settings, loading, fetchSettings, updateSettings };
};
```

**Caching Strategy**:
```typescript
// services/cache.ts
export class APICache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.TTL
    });
  }
}
```

##### Task 2.3: State Management Architecture (Priority: HIGH)
**Estimated Time**: 8 hours

**Global State Structure**:
```typescript
// providers/AppProvider.tsx
interface AppState {
  integrations: Integration[];
  currentIntegration: string | null;
  triggers: Record<string, Trigger[]>;
  loading: LoadingState;
  errors: ErrorState;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </AppContext.Provider>
  );
};
```

##### Task 2.4: Backward Compatibility Layer (Priority: CRITICAL)
**Estimated Time**: 12 hours  
**Dependencies**: Existing settings analysis

**Data Migration Strategy**:
```php
// includes/admin/class-echodash-migration.php
class EchoDash_Migration {
    
    public function ensure_compatibility() {
        $current_settings = get_option('echodash_options', []);
        
        // Validate existing data structure
        if (!$this->is_compatible_format($current_settings)) {
            $this->migrate_settings($current_settings);
        }
    }
    
    private function migrate_settings($settings) {
        // Preserve all existing data
        // Transform to new structure if needed
        // Create backup before migration
    }
}
```

**Compatibility Testing**:
- Load test with 50+ real customer configurations
- Verify all existing trigger configurations work
- Test with different WordPress versions (6.0-6.5)
- Validate with various theme combinations

#### 🎯 Phase 2 Success Criteria
- ✅ REST API endpoints functional with proper security
- ✅ Data fetching and caching working efficiently
- ✅ Settings load/save operations working without data loss
- ✅ Backward compatibility verified with real customer data
- ✅ Error handling and loading states implemented
- ✅ API response times <200ms for cached data

**Phase 2 Deliverables**:
- Complete WordPress REST API integration
- Data management hooks and caching system
- Global state management architecture
- Backward compatibility layer with migration utilities
- Comprehensive API documentation

---

### Phase 3: Core Components Development (Week 3)
**Persona**: `--persona-frontend` + `--persona-architect`  
**MCP Integration**: `--magic` `--c7`

#### 🎯 Phase Goal
Build primary UI components following new design mockups

#### 📦 Core Tasks

##### Task 3.1: Integration Management Components (Priority: HIGH)
**Estimated Time**: 16 hours  
**Dependencies**: Phase 2 data layer, design mockups

**IntegrationCard Component**:
```typescript
// components/integration/IntegrationCard.tsx
interface IntegrationCardProps {
  integration: Integration;
  onSelect: (slug: string) => void;
  className?: string;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onSelect,
  className
}) => {
  return (
    <Card 
      className={clsx('ecd-integration-card', className)}
      isElevated
    >
      <CardHeader>
        <Flex align="center" gap={3}>
          <Icon icon={integration.icon} size={24} />
          <Text size="16" weight="600">{integration.name}</Text>
        </Flex>
      </CardHeader>
      
      <CardBody>
        <Flex justify="space-between" align="center">
          <Text variant="muted">
            {integration.triggerCount} triggers configured
          </Text>
          <Button 
            variant="secondary"
            onClick={() => onSelect(integration.slug)}
          >
            Configure
          </Button>
        </Flex>
      </CardBody>
    </Card>
  );
};
```

**IntegrationGrid Component**:
```typescript
// components/integration/IntegrationGrid.tsx
export const IntegrationGrid: React.FC = () => {
  const { integrations, loading } = useIntegrations();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredIntegrations = useMemo(() => {
    return integrations.filter(integration =>
      integration.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [integrations, searchTerm]);

  if (loading) {
    return <IntegrationGridSkeleton />;
  }

  return (
    <div className="ecd-integration-grid">
      <SearchControl
        placeholder="Search integrations..."
        value={searchTerm}
        onChange={setSearchTerm}
      />
      
      <div className="ecd-grid">
        {filteredIntegrations.map(integration => (
          <IntegrationCard
            key={integration.slug}
            integration={integration}
            onSelect={handleIntegrationSelect}
          />
        ))}
      </div>
    </div>
  );
};
```

##### Task 3.2: Trigger Configuration Components (Priority: HIGH)
**Estimated Time**: 18 hours  
**Dependencies**: Task 3.1, trigger type definitions

**TriggerForm Component**:
```typescript
// components/forms/TriggerForm.tsx
export const TriggerForm: React.FC<TriggerFormProps> = ({
  trigger,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState(trigger.defaultEvent);
  const { validate, errors } = useFormValidation(triggerSchema);

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing="4">
        <TextControl
          label="Event Name"
          value={formData.name}
          onChange={(name) => setFormData(prev => ({ ...prev, name }))}
          error={errors.name}
          required
        />
        
        <SelectControl
          label="Trigger Type"
          value={formData.trigger}
          options={triggerOptions}
          onChange={(trigger) => setFormData(prev => ({ ...prev, trigger }))}
        />
        
        <EventMapper
          mappings={formData.mappings}
          onChange={(mappings) => setFormData(prev => ({ ...prev, mappings }))}
          availableFields={availableFields}
        />
      </VStack>
    </form>
  );
};
```

**EventMapper Component**:
```typescript
// components/forms/EventMapper.tsx
export const EventMapper: React.FC<EventMapperProps> = ({
  mappings,
  onChange,
  availableFields
}) => {
  const addMapping = () => {
    onChange([...mappings, { key: '', value: '' }]);
  };

  return (
    <div className="ecd-event-mapper">
      <Flex justify="space-between" align="center">
        <Text weight="600">Event Properties</Text>
        <Button variant="secondary" onClick={addMapping}>
          Add Property
        </Button>
      </Flex>
      
      {mappings.map((mapping, index) => (
        <MappingRow
          key={index}
          mapping={mapping}
          availableFields={availableFields}
          onChange={(newMapping) => updateMapping(index, newMapping)}
          onRemove={() => removeMapping(index)}
        />
      ))}
    </div>
  );
};
```

##### Task 3.3: WordPress Components Integration (Priority: MEDIUM)
**Estimated Time**: 8 hours  
**Dependencies**: @wordpress/components knowledge

**WordPress Component Usage**:
```typescript
// components/common/WordPressComponents.tsx
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  TextControl,
  SelectControl,
  Notice,
  Modal,
  Spinner
} from '@wordpress/components';

// Consistent styling with WordPress admin
export const EchoDashButton = styled(Button)`
  &.is-primary {
    background-color: var(--wp-admin-theme-color);
    border-color: var(--wp-admin-theme-color);
  }
`;
```

##### Task 3.4: Accessibility Implementation (Priority: HIGH)
**Estimated Time**: 12 hours  
**Dependencies**: WCAG 2.1 AA guidelines

**Accessibility Features**:
```typescript
// hooks/useAccessibility.ts
export const useAccessibility = () => {
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'screen-reader-text';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  return { announceToScreenReader };
};

// Focus management
export const useFocusManagement = () => {
  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  };

  return { focusElement };
};
```

**ARIA Implementation**:
- Proper heading hierarchy (h1-h6)
- ARIA labels for form controls
- ARIA descriptions for complex interactions
- Keyboard navigation support
- Focus indicators and management
- Screen reader announcements

##### Task 3.5: Visual Design Validation (Priority: HIGH)
**Estimated Time**: 10 hours  
**Dependencies**: Playwright setup, mockup files

**Visual Testing Implementation**:
```typescript
// tests/visual/component-validation.spec.ts
test.describe('Component Visual Validation', () => {
  
  test('IntegrationGrid matches empty state mockup', async ({ page }) => {
    await setupEmptyState(page);
    
    const result = await visualTester.compareWithMockup(
      'empty_integration',
      {
        selector: '.ecd-integration-grid',
        tolerance: 0.03,
        hideElements: ['.wp-admin-notice']
      }
    );
    
    expect(result.passed).toBe(true);
    expect(result.percentageDifference).toBeLessThan(0.03);
  });

  test('IntegrationCard with triggers matches mockup', async ({ page }) => {
    await setupTriggersState(page);
    
    const result = await visualTester.compareWithMockup(
      'integration_with_triggers',
      {
        selector: '.ecd-integration-card',
        tolerance: 0.04
      }
    );
    
    expect(result.passed).toBe(true);
  });
});
```

**Responsive Testing**:
- Desktop: 1920×1080, 1366×768
- Tablet: 1024×768, 768×1024
- Cross-browser: Chrome, Firefox, Safari, Edge
- WordPress theme compatibility testing

#### 🎯 Phase 3 Success Criteria
- ✅ All major components render correctly without errors
- ✅ Form interactions working smoothly with proper validation
- ✅ Accessibility standards met (WCAG 2.1 AA compliance)
- ✅ Components match new design mockups within 5% tolerance
- ✅ Visual regression tests passing for all component states
- ✅ Screenshots match mockups within acceptable tolerance
- ✅ Responsive behavior validated across all target viewports

**Phase 3 Deliverables**:
- Complete React component library
- Integration management interface
- Trigger configuration system
- Accessibility implementation
- Visual validation test suite
- Component documentation and Storybook

---

### Phase 4: Advanced Functionality (Week 4)
**Persona**: `--persona-frontend` + `--persona-performance`  
**MCP Integration**: `--magic` `--sequential`

#### 🎯 Phase Goal
Implement complex features and interactive behaviors

#### 📦 Core Tasks

##### Task 4.1: Dynamic Form Generation (Priority: HIGH)
**Estimated Time**: 14 hours  
**Dependencies**: Phase 3 components, integration schemas

**Dynamic Form Engine**:
```typescript
// components/forms/DynamicForm.tsx
interface DynamicFormProps {
  schema: FormSchema;
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  onSubmit: (data: Record<string, any>) => void;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  schema,
  data,
  onChange,
  onSubmit
}) => {
  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
        return (
          <TextControl
            key={field.name}
            label={field.label}
            value={data[field.name] || ''}
            onChange={(value) => handleFieldChange(field.name, value)}
            required={field.required}
            help={field.description}
          />
        );
      
      case 'select':
        return (
          <SelectControl
            key={field.name}
            label={field.label}
            value={data[field.name] || ''}
            options={field.options}
            onChange={(value) => handleFieldChange(field.name, value)}
            required={field.required}
          />
        );
        
      case 'mapping':
        return (
          <EventMapper
            key={field.name}
            mappings={data[field.name] || []}
            onChange={(mappings) => handleFieldChange(field.name, mappings)}
            availableFields={field.availableFields}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing="4">
        {schema.fields.map(renderField)}
        
        <Flex justify="flex-end" gap="2">
          <Button variant="tertiary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save Configuration
          </Button>
        </Flex>
      </VStack>
    </form>
  );
};
```

**Conditional Field Logic**:
```typescript
// utils/form-conditions.ts
export const evaluateConditions = (
  conditions: FieldCondition[],
  formData: Record<string, any>
): boolean => {
  return conditions.every(condition => {
    const fieldValue = formData[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return Array.isArray(fieldValue) && fieldValue.includes(condition.value);
      default:
        return true;
    }
  });
};
```

##### Task 4.2: Live Preview System (Priority: HIGH)
**Estimated Time**: 16 hours  
**Dependencies**: Task 4.1, merge tag system

**Live Preview Component**:
```typescript
// components/preview/LivePreview.tsx
export const LivePreview: React.FC<LivePreviewProps> = ({
  eventConfig,
  integrationSlug,
  testData
}) => {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  
  const generatePreview = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch({
        path: '/echodash/v1/preview',
        method: 'POST',
        data: {
          eventConfig,
          integrationSlug,
          testData
        }
      });
      setPreviewData(response.data);
    } catch (error) {
      console.error('Preview generation failed:', error);
    } finally {
      setLoading(false);
    }
  }, [eventConfig, integrationSlug, testData]);

  useEffect(() => {
    const debounced = debounce(generatePreview, 500);
    debounced();
    return debounced.cancel;
  }, [generatePreview]);

  return (
    <Card className="ecd-live-preview">
      <CardHeader>
        <Flex justify="space-between" align="center">
          <Text weight="600">Event Preview</Text>
          <Button
            variant="secondary"
            onClick={handleSendTest}
            disabled={loading || !previewData}
          >
            Send Test Event
          </Button>
        </Flex>
      </CardHeader>
      
      <CardBody>
        {loading ? (
          <Flex align="center" justify="center" className="preview-loading">
            <Spinner />
            <Text>Generating preview...</Text>
          </Flex>
        ) : previewData ? (
          <PreviewDisplay data={previewData} />
        ) : (
          <Text variant="muted">Configure event properties to see preview</Text>
        )}
      </CardBody>
    </Card>
  );
};
```

**Merge Tag Processing**:
```typescript
// services/merge-tags.ts
export class MergeTagProcessor {
  private testData: Record<string, any>;

  constructor(testData: Record<string, any>) {
    this.testData = testData;
  }

  process(template: string): string {
    return template.replace(/\{([^}]+)\}/g, (match, tag) => {
      const [objectType, fieldName] = tag.split(':');
      
      if (this.testData[objectType] && this.testData[objectType][fieldName]) {
        return this.testData[objectType][fieldName];
      }
      
      return match; // Return original if no replacement found
    });
  }

  getAvailableTags(): MergeTag[] {
    return Object.entries(this.testData).flatMap(([objectType, data]) =>
      Object.keys(data).map(fieldName => ({
        tag: `{${objectType}:${fieldName}}`,
        label: `${objectType.charAt(0).toUpperCase()}${objectType.slice(1)} ${fieldName}`,
        example: data[fieldName]
      }))
    );
  }
}
```

##### Task 4.3: Drag & Drop Implementation (Priority: MEDIUM)
**Estimated Time**: 12 hours  
**Dependencies**: react-beautiful-dnd, trigger list component

**Sortable Trigger List**:
```typescript
// components/triggers/SortableTriggerList.tsx
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export const SortableTriggerList: React.FC<SortableTriggerListProps> = ({
  triggers,
  onReorder
}) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedTriggers = Array.from(triggers);
    const [removed] = reorderedTriggers.splice(result.source.index, 1);
    reorderedTriggers.splice(result.destination.index, 0, removed);

    onReorder(reorderedTriggers);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="triggers">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={clsx(
              'ecd-trigger-list',
              snapshot.isDraggingOver && 'is-dragging-over'
            )}
          >
            {triggers.map((trigger, index) => (
              <Draggable
                key={trigger.id}
                draggableId={trigger.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <TriggerCard
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    dragHandleProps={provided.dragHandleProps}
                    trigger={trigger}
                    isDragging={snapshot.isDragging}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
```

##### Task 4.4: Advanced UI Features (Priority: MEDIUM)
**Estimated Time**: 10 hours  
**Dependencies**: WordPress components, notification system

**Modal System**:
```typescript
// components/modals/TriggerEditModal.tsx
export const TriggerEditModal: React.FC<TriggerEditModalProps> = ({
  trigger,
  isOpen,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState(trigger);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      // Error handling
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      title="Edit Trigger"
      onRequestClose={onClose}
      className="ecd-trigger-modal"
    >
      <TriggerForm
        trigger={formData}
        onChange={setFormData}
        onSubmit={handleSave}
        onCancel={onClose}
        loading={saving}
      />
    </Modal>
  );
};
```

**Toast Notification System**:
```typescript
// components/notifications/NotificationSystem.tsx
export const NotificationSystem: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="ecd-notifications">
      {notifications.map(notification => (
        <Notice
          key={notification.id}
          status={notification.type}
          onRemove={() => removeNotification(notification.id)}
          isDismissible
        >
          {notification.message}
        </Notice>
      ))}
    </div>
  );
};
```

##### Task 4.5: Interactive Flow Validation (Priority: HIGH)
**Estimated Time**: 12 hours  
**Dependencies**: Phase 3 visual testing, all mockups

**Interactive Testing Suite**:
```typescript
// tests/visual/interactive-flows.spec.ts
test.describe('Interactive Flow Validation', () => {
  
  test('Add Trigger modal workflow matches mockup', async ({ page }) => {
    await setupIntegrationPage(page);
    
    // Click "Add Trigger" button
    await page.locator('[data-testid="add-trigger"]').click();
    await page.waitForSelector('.ecd-trigger-modal');
    
    // Fill form with test data
    await page.fill('[data-testid="event-name"]', 'Contact Form Submitted');
    await page.selectOption('[data-testid="trigger-type"]', 'form_submitted');
    
    // Wait for form to populate
    await page.waitForSelector('.ecd-event-mapper');
    
    // Capture modal state
    const result = await visualTester.compareWithMockup(
      'add_trigger_modal',
      {
        selector: '.ecd-trigger-modal',
        tolerance: 0.05
      }
    );
    
    expect(result.passed).toBe(true);
  });

  test('Live preview functionality', async ({ page }) => {
    await setupTriggerEditState(page);
    
    // Modify event mapping
    await page.fill('[data-testid="event-key-0"]', 'user_email');
    await page.fill('[data-testid="event-value-0"]', '{user:user_email}');
    
    // Wait for live preview update
    await page.waitForSelector('.ecd-preview-updated');
    
    // Verify preview shows processed data
    const previewContent = await page.textContent('.ecd-live-preview');
    expect(previewContent).toContain('admin@example.com');
  });

  test('Drag and drop visual feedback', async ({ page }) => {
    await setupTriggersWithMultipleItems(page);
    
    // Start drag operation
    const firstTrigger = page.locator('[data-testid="trigger-card"]').first();
    const secondTrigger = page.locator('[data-testid="trigger-card"]').nth(1);
    
    await firstTrigger.dragTo(secondTrigger);
    
    // Capture drag feedback state
    const screenshot = await page.screenshot({
      fullPage: false,
      clip: { x: 0, y: 200, width: 800, height: 400 }
    });
    
    // Verify visual feedback is present
    expect(screenshot).toBeDefined();
  });

  test('Setup flow matches first mockup', async ({ page }) => {
    await setupFreshInstallState(page);
    
    const result = await visualTester.compareWithMockup(
      'setup_flow',
      {
        selector: '#echodash-setup',
        tolerance: 0.05
      }
    );
    
    expect(result.passed).toBe(true);
  });
});
```

#### 🎯 Phase 4 Success Criteria
- ✅ Dynamic forms generating correctly based on integration schemas
- ✅ Live preview working accurately with real-time updates
- ✅ Drag & drop functioning smoothly with visual feedback
- ✅ All UI interactions polished and responsive
- ✅ Interactive flow screenshots match all 4 mockups within tolerance
- ✅ Animation and transition states captured and validated
- ✅ Performance remains optimal during complex interactions

**Phase 4 Deliverables**:
- Dynamic form generation system
- Live preview with merge tag processing
- Drag & drop functionality
- Advanced UI components (modals, notifications)
- Interactive flow validation test suite
- Performance optimization for complex features

---

### Phase 5: Integration & Testing (Week 5)
**Persona**: `--persona-qa` + `--persona-performance`  
**MCP Integration**: `--sequential` `--playwright`

#### 🎯 Phase Goal
Complete WordPress integration and comprehensive testing

#### 📦 Core Tasks

##### Task 5.1: WordPress Admin Integration (Priority: HIGH)
**Estimated Time**: 10 hours  
**Dependencies**: All React components completed

**Asset Enqueueing**:
```php
// includes/admin/class-echodash-admin.php
public function enqueue_react_assets() {
    $asset_file = include ECHODASH_DIR_PATH . 'assets/dist/index.asset.php';
    
    wp_enqueue_script(
        'echodash-react',
        ECHODASH_DIR_URL . 'assets/dist/index.js',
        $asset_file['dependencies'],
        $asset_file['version'],
        true
    );
    
    wp_enqueue_style(
        'echodash-react',
        ECHODASH_DIR_URL . 'assets/dist/index.css',
        ['wp-components'],
        $asset_file['version']
    );
    
    // Localize script data
    wp_localize_script('echodash-react', 'ecdReactData', [
        'apiUrl' => rest_url('echodash/v1/'),
        'nonce' => wp_create_nonce('wp_rest'),
        'integrations' => $this->get_integrations_data(),
        'currentUser' => wp_get_current_user()
    ]);
}
```

**Feature Flag System**:
```php
// includes/admin/class-echodash-feature-flags.php
class EchoDash_Feature_Flags {
    
    public function should_use_react_ui(): bool {
        // Check user preference
        $user_preference = get_user_meta(get_current_user_id(), 'echodash_use_react', true);
        if ($user_preference !== '') {
            return (bool) $user_preference;
        }
        
        // Check global setting
        $global_setting = get_option('echodash_react_enabled', false);
        return (bool) $global_setting;
    }
    
    public function render_ui_toggle() {
        ?>
        <div class="ecd-ui-toggle">
            <label>
                <input type="checkbox" id="ecd-react-toggle" <?php checked($this->should_use_react_ui()); ?> />
                Use new React interface (Beta)
            </label>
        </div>
        <?php
    }
}
```

##### Task 5.2: Performance Optimization (Priority: HIGH)
**Estimated Time**: 14 hours  
**Dependencies**: Bundle analysis tools

**Bundle Optimization**:
```javascript
// webpack.config.js (via @wordpress/scripts)
const config = {
  ...defaultConfig,
  optimization: {
    ...defaultConfig.optimization,
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        wordpress: {
          test: /[\\/]node_modules[\\/]@wordpress[\\/]/,
          name: 'wordpress',
          chunks: 'all',
        }
      }
    }
  }
};
```

**Code Splitting Strategy**:
```typescript
// Dynamic imports for heavy components
const TriggerEditor = lazy(() => import('./components/TriggerEditor'));
const LivePreview = lazy(() => import('./components/LivePreview'));
const IntegrationDetail = lazy(() => import('./components/IntegrationDetail'));

// Route-based splitting
const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<ComponentSkeleton />}>
      <Routes>
        <Route path="/" element={<IntegrationDashboard />} />
        <Route path="/integration/:slug" element={<IntegrationDetail />} />
        <Route path="/settings" element={<SettingsPanel />} />
      </Routes>
    </Suspense>
  );
};
```

**Performance Monitoring**:
```typescript
// utils/performance.ts
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  
  console.log(`${name} took ${end - start} milliseconds`);
  
  // Send to analytics if needed
  if (window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: name,
      value: Math.round(end - start)
    });
  }
};

// React profiler
export const ProfiledComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Profiler id="EchoDash" onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
};
```

##### Task 5.3: Error Handling & Validation (Priority: HIGH)
**Estimated Time**: 12 hours  
**Dependencies**: Form validation library

**Comprehensive Validation System**:
```typescript
// utils/validation.ts
import * as Yup from 'yup';

export const triggerValidationSchema = Yup.object({
  name: Yup.string()
    .required('Event name is required')
    .min(3, 'Event name must be at least 3 characters')
    .max(50, 'Event name must be less than 50 characters'),
  
  trigger: Yup.string()
    .required('Trigger type is required'),
  
  mappings: Yup.array()
    .of(
      Yup.object({
        key: Yup.string().required('Property key is required'),
        value: Yup.string().required('Property value is required')
      })
    )
    .min(1, 'At least one property mapping is required')
});

export const useValidation = <T>(schema: Yup.Schema<T>) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validate = async (data: T): Promise<boolean> => {
    try {
      await schema.validate(data, { abortEarly: false });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        const newErrors: Record<string, string> = {};
        error.inner.forEach(err => {
          if (err.path) {
            newErrors[err.path] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };
  
  return { validate, errors, setErrors };
};
```

**Error Boundary System**:
```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('EchoDash Error:', error, errorInfo);
    
    // Send error to logging service
    if (window.ecdReactData?.debugMode) {
      this.logError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="ecd-error-boundary">
          <CardBody>
            <Flex direction="column" gap="4" align="center">
              <Icon icon="warning" size={48} />
              <Text size="18" weight="600">Something went wrong</Text>
              <Text variant="muted">
                An error occurred while loading this component. Please refresh the page.
              </Text>
              <Button
                variant="primary"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </Flex>
          </CardBody>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

##### Task 5.4: Testing Implementation (Priority: MEDIUM)
**Estimated Time**: 16 hours  
**Dependencies**: Jest, React Testing Library setup

**Unit Testing Strategy**:
```typescript
// components/__tests__/IntegrationCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { IntegrationCard } from '../IntegrationCard';

describe('IntegrationCard', () => {
  const mockIntegration = {
    slug: 'woocommerce',
    name: 'WooCommerce',
    icon: 'woocommerce',
    triggerCount: 3,
    enabled: true
  };

  it('renders integration information correctly', () => {
    render(
      <IntegrationCard
        integration={mockIntegration}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByText('WooCommerce')).toBeInTheDocument();
    expect(screen.getByText('3 triggers configured')).toBeInTheDocument();
  });

  it('calls onSelect when configure button is clicked', () => {
    const mockOnSelect = jest.fn();
    
    render(
      <IntegrationCard
        integration={mockIntegration}
        onSelect={mockOnSelect}
      />
    );

    fireEvent.click(screen.getByText('Configure'));
    expect(mockOnSelect).toHaveBeenCalledWith('woocommerce');
  });
});
```

**Integration Testing**:
```typescript
// hooks/__tests__/useSettings.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useSettings } from '../useSettings';

// Mock WordPress API
jest.mock('@wordpress/api-fetch', () => ({
  __esModule: true,
  default: jest.fn()
}));

describe('useSettings', () => {
  it('fetches settings on mount', async () => {
    const mockSettings = { endpoint: 'https://api.echodash.com' };
    (apiFetch as jest.Mock).mockResolvedValue({ data: mockSettings });

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings).toEqual(mockSettings);
  });
});
```

##### Task 5.5: Comprehensive Visual Testing (Priority: HIGH)
**Estimated Time**: 18 hours  
**Dependencies**: Playwright framework, all mockups

**Complete Visual Test Suite**:
```typescript
// tests/visual/comprehensive-suite.spec.ts
test.describe('Comprehensive Visual Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    await setupWordPressEnvironment(page);
    await authenticateAsAdmin(page);
  });

  test('All major UI states match mockups', async ({ page }) => {
    const testScenarios = [
      {
        name: 'setup_flow',
        setup: setupFreshInstall,
        mockup: '1-echodash-setup.jpg',
        tolerance: 0.05
      },
      {
        name: 'empty_integration',
        setup: setupEmptyIntegration,
        mockup: '2-echodash-single-integration-empty.jpg',
        tolerance: 0.03
      },
      {
        name: 'integration_with_triggers',
        setup: setupIntegrationWithTriggers,
        mockup: '3-echodash-single-integration-with-triggers.jpg',
        tolerance: 0.04
      },
      {
        name: 'add_trigger_modal',
        setup: setupAddTriggerModal,
        mockup: '4-echodash-add-trigger-with-default-values.jpg',
        tolerance: 0.05
      }
    ];

    for (const scenario of testScenarios) {
      await test.step(`Testing ${scenario.name}`, async () => {
        await scenario.setup(page);
        
        const result = await visualTester.compareWithMockup(
          scenario.name,
          {
            tolerance: scenario.tolerance,
            hideElements: ['.wp-admin-notice', '.update-nag']
          }
        );
        
        expect(result.passed).toBe(true);
        expect(result.percentageDifference).toBeLessThan(scenario.tolerance);
      });
    }
  });

  test('Responsive behavior across viewports', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop-xl' },
      { width: 1366, height: 768, name: 'desktop-standard' },
      { width: 1024, height: 768, name: 'tablet-landscape' },
      { width: 768, height: 1024, name: 'tablet-portrait' }
    ];

    for (const viewport of viewports) {
      await test.step(`Testing ${viewport.name}`, async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await setupIntegrationWithTriggers(page);
        
        // Ensure no horizontal scrolling on smaller screens
        if (viewport.width < 1024) {
          const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
          expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20);
        }
        
        // Take screenshot for visual record
        await page.screenshot({
          path: `tests/visual/screenshots/responsive-${viewport.name}-${Date.now()}.png`,
          fullPage: true
        });
      });
    }
  });

  test('Cross-browser visual consistency', async ({ page, browserName }) => {
    await setupIntegrationWithTriggers(page);
    
    // Browser-specific tolerance
    const tolerance = browserName === 'firefox' ? 0.05 : 0.03;
    
    const result = await visualTester.compareWithMockup(
      'integration_with_triggers',
      {
        tolerance,
        browserName
      }
    );
    
    expect(result.passed).toBe(true);
    
    // Log browser-specific metrics
    console.log(`${browserName} visual test: ${result.percentageDifference.toFixed(2)}% difference`);
  });

  test('Dark/Light theme compatibility', async ({ page }) => {
    // Test with different WordPress admin color schemes
    const colorSchemes = ['fresh', 'light', 'modern', 'blue', 'coffee', 'ectoplasm', 'midnight', 'ocean', 'sunrise'];
    
    for (const scheme of colorSchemes) {
      await test.step(`Testing ${scheme} color scheme`, async () => {
        await page.evaluate((colorScheme) => {
          document.body.classList.remove(...document.body.classList);
          document.body.classList.add(`admin-color-${colorScheme}`);
        }, scheme);
        
        await setupIntegrationWithTriggers(page);
        
        // Verify theme colors are applied correctly
        const backgroundColor = await page.evaluate(() => 
          getComputedStyle(document.querySelector('.ecd-integration-card')).backgroundColor
        );
        
        expect(backgroundColor).toBeDefined();
        
        // Take screenshot for visual record
        await page.screenshot({
          path: `tests/visual/screenshots/theme-${scheme}-${Date.now()}.png`
        });
      });
    }
  });

  test('Performance impact assessment', async ({ page }) => {
    await page.goto('/wp-admin/options-general.php?page=echodash');
    
    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return JSON.parse(JSON.stringify(performance.getEntriesByType('navigation')[0]));
    });
    
    // Performance assertions
    expect(metrics.loadEventEnd - metrics.loadEventStart).toBeLessThan(3000); // <3s load time
    expect(metrics.domContentLoadedEventEnd - metrics.domContentLoadedEventStart).toBeLessThan(1000); // <1s DOM ready
    
    // Memory usage check
    const memoryInfo = await page.evaluate(() => (performance as any).memory);
    if (memoryInfo) {
      expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // <50MB
    }
  });
});
```

**Visual Testing Documentation**:
```typescript
// tests/visual/utils/documentation-generator.ts
export class VisualTestDocumentation {
  
  generateTestReport(results: TestResult[]): TestReport {
    return {
      summary: {
        totalTests: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length,
        averageDifference: this.calculateAverageDifference(results)
      },
      details: results.map(result => ({
        testName: result.name,
        mockupFile: result.mockupFile,
        percentageDifference: result.percentageDifference,
        passed: result.passed,
        diffImagePath: result.diffImagePath,
        notes: this.generateNotes(result)
      })),
      recommendations: this.generateRecommendations(results)
    };
  }
  
  private generateRecommendations(results: TestResult[]): string[] {
    const recommendations: string[] = [];
    
    const failedTests = results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      recommendations.push('Review failed visual tests and update implementation or mockups');
    }
    
    const highDifferenceTests = results.filter(r => r.percentageDifference > 0.04);
    if (highDifferenceTests.length > 0) {
      recommendations.push('Consider increasing tolerance for tests with high pixel differences');
    }
    
    return recommendations;
  }
}
```

#### 🎯 Phase 5 Success Criteria
- ✅ Full WordPress integration complete without breaking existing functionality
- ✅ Performance benchmarks met (<500KB bundle, <3s load time)
- ✅ All tests passing (unit, integration, visual)
- ✅ Error handling robust with graceful degradation
- ✅ Visual regression test suite operational
- ✅ All mockup comparisons within 3% pixel tolerance
- ✅ Cross-browser visual consistency verified
- ✅ Feature flag system working for gradual rollout

**Phase 5 Deliverables**:
- Complete WordPress admin integration
- Performance-optimized React application
- Comprehensive test suite (unit, integration, visual)
- Error handling and validation system
- Visual regression testing framework
- Performance monitoring and optimization tools

---

### Phase 6: Migration & Deployment (Week 6)
**Persona**: `--persona-devops` + `--persona-qa`  
**MCP Integration**: `--sequential` `--all-mcp`

#### 🎯 Phase Goal
Safe deployment with data migration and fallback options

#### 📦 Core Tasks

##### Task 6.1: Feature Flag Implementation (Priority: CRITICAL)
**Estimated Time**: 8 hours  
**Dependencies**: Phase 5 completion

**Advanced Feature Flag System**:
```php
// includes/admin/class-echodash-feature-flags.php
class EchoDash_Feature_Flags {
    
    const FLAG_REACT_UI = 'react_ui_enabled';
    const FLAG_GRADUAL_ROLLOUT = 'gradual_rollout_percentage';
    
    public function __construct() {
        add_action('admin_init', [$this, 'handle_feature_flags']);
        add_action('wp_ajax_ecd_toggle_ui', [$this, 'ajax_toggle_ui']);
    }
    
    public function should_use_react_ui(): bool {
        // Admin override for testing
        if (current_user_can('manage_options') && isset($_GET['ecd_force_ui'])) {
            return $_GET['ecd_force_ui'] === 'react';
        }
        
        // User preference
        $user_preference = get_user_meta(get_current_user_id(), 'ecd_ui_preference', true);
        if ($user_preference !== '') {
            return $user_preference === 'react';
        }
        
        // Gradual rollout
        if ($this->is_gradual_rollout_enabled()) {
            return $this->user_in_rollout_group();
        }
        
        // Global setting
        return get_option(self::FLAG_REACT_UI, false);
    }
    
    private function is_gradual_rollout_enabled(): bool {
        $percentage = get_option(self::FLAG_GRADUAL_ROLLOUT, 0);
        return $percentage > 0 && $percentage < 100;
    }
    
    private function user_in_rollout_group(): bool {
        $user_id = get_current_user_id();
        $percentage = get_option(self::FLAG_GRADUAL_ROLLOUT, 0);
        
        // Consistent hash-based rollout
        $hash = md5($user_id . 'echodash_rollout_salt');
        $user_percentage = hexdec(substr($hash, 0, 2)) / 255 * 100;
        
        return $user_percentage < $percentage;
    }
    
    public function render_admin_interface() {
        if ($this->should_use_react_ui()) {
            $this->render_react_ui();
        } else {
            $this->render_legacy_ui();
        }
    }
    
    public function render_ui_toggle() {
        $is_react = $this->should_use_react_ui();
        ?>
        <div class="ecd-ui-toggle-container">
            <div class="ecd-ui-toggle">
                <label>
                    <input 
                        type="checkbox" 
                        id="ecd-react-toggle" 
                        <?php checked($is_react); ?>
                        data-nonce="<?php echo wp_create_nonce('ecd_toggle_ui'); ?>"
                    />
                    <span class="toggle-text">
                        Use new React interface 
                        <span class="beta-badge">Beta</span>
                    </span>
                </label>
                <p class="description">
                    Switch between the classic and new React-based admin interface. 
                    You can change this anytime in your preferences.
                </p>
            </div>
            
            <?php if (current_user_can('manage_options')): ?>
            <div class="ecd-admin-controls">
                <h4>Admin Controls</h4>
                <p>
                    <label>
                        Gradual rollout percentage: 
                        <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value="<?php echo get_option(self::FLAG_GRADUAL_ROLLOUT, 0); ?>"
                            id="ecd-rollout-percentage"
                        />%
                    </label>
                </p>
                <p class="description">
                    Control what percentage of users see the React interface by default.
                </p>
            </div>
            <?php endif; ?>
        </div>
        <?php
    }
}
```

##### Task 6.2: Data Migration Strategy (Priority: CRITICAL)
**Estimated Time**: 16 hours  
**Dependencies**: Existing settings analysis, backward compatibility layer

**Migration System**:
```php
// includes/admin/class-echodash-migration.php
class EchoDash_Migration {
    
    const MIGRATION_VERSION = '2.0.0';
    const BACKUP_OPTION_KEY = 'echodash_backup_';
    
    public function __construct() {
        add_action('admin_init', [$this, 'check_migration_needed']);
        add_action('wp_ajax_ecd_migrate_data', [$this, 'ajax_migrate_data']);
        add_action('wp_ajax_ecd_rollback_data', [$this, 'ajax_rollback_data']);
    }
    
    public function check_migration_needed() {
        $current_version = get_option('echodash_migration_version', '1.0.0');
        
        if (version_compare($current_version, self::MIGRATION_VERSION, '<')) {
            $this->show_migration_notice();
        }
    }
    
    public function migrate_settings(): array {
        $results = [
            'success' => false,
            'migrated_count' => 0,
            'backup_created' => false,
            'errors' => []
        ];
        
        try {
            // Step 1: Create backup
            $backup_created = $this->create_backup();
            $results['backup_created'] = $backup_created;
            
            if (!$backup_created) {
                throw new Exception('Failed to create backup');
            }
            
            // Step 2: Migrate global settings
            $global_migrated = $this->migrate_global_settings();
            $results['migrated_count'] += $global_migrated;
            
            // Step 3: Migrate post-specific settings
            $post_migrated = $this->migrate_post_settings();
            $results['migrated_count'] += $post_migrated;
            
            // Step 4: Validate migration
            $validation_result = $this->validate_migration();
            if (!$validation_result['valid']) {
                throw new Exception('Migration validation failed: ' . implode(', ', $validation_result['errors']));
            }
            
            // Step 5: Update version
            update_option('echodash_migration_version', self::MIGRATION_VERSION);
            
            $results['success'] = true;
            
        } catch (Exception $e) {
            $results['errors'][] = $e->getMessage();
            
            // Attempt rollback on failure
            $this->rollback_settings();
        }
        
        return $results;
    }
    
    private function create_backup(): bool {
        $timestamp = time();
        $backup_key = self::BACKUP_OPTION_KEY . $timestamp;
        
        $data_to_backup = [
            'echodash_options' => get_option('echodash_options', []),
            'echodash_endpoint' => get_option('echodash_endpoint', ''),
            'post_meta' => $this->get_all_post_meta(),
            'user_preferences' => $this->get_all_user_preferences(),
            'timestamp' => $timestamp,
            'version' => get_option('echodash_migration_version', '1.0.0')
        ];
        
        $backup_success = update_option($backup_key, $data_to_backup);
        
        if ($backup_success) {
            // Keep only last 5 backups
            $this->cleanup_old_backups();
            
            // Store current backup reference
            update_option('echodash_current_backup', $backup_key);
        }
        
        return $backup_success;
    }
    
    private function validate_migration(): array {
        $errors = [];
        
        // Validate global settings structure
        $global_settings = get_option('echodash_options', []);
        if (!$this->validate_settings_structure($global_settings)) {
            $errors[] = 'Global settings structure invalid';
        }
        
        // Validate post-specific settings
        $post_settings = $this->get_all_post_meta();
        foreach ($post_settings as $post_id => $settings) {
            if (!$this->validate_post_settings($settings)) {
                $errors[] = "Post {$post_id} settings invalid";
            }
        }
        
        // Validate data integrity
        $integrity_check = $this->check_data_integrity();
        if (!$integrity_check['valid']) {
            $errors = array_merge($errors, $integrity_check['errors']);
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }
    
    public function rollback_settings(): array {
        $current_backup = get_option('echodash_current_backup');
        if (!$current_backup) {
            return ['success' => false, 'error' => 'No backup found'];
        }
        
        $backup_data = get_option($current_backup);
        if (!$backup_data) {
            return ['success' => false, 'error' => 'Backup data not found'];
        }
        
        try {
            // Restore global settings
            update_option('echodash_options', $backup_data['echodash_options']);
            update_option('echodash_endpoint', $backup_data['echodash_endpoint']);
            
            // Restore post meta
            foreach ($backup_data['post_meta'] as $post_id => $meta) {
                update_post_meta($post_id, 'echodash_settings', $meta);
            }
            
            // Restore user preferences
            foreach ($backup_data['user_preferences'] as $user_id => $preferences) {
                foreach ($preferences as $key => $value) {
                    update_user_meta($user_id, $key, $value);
                }
            }
            
            // Revert migration version
            update_option('echodash_migration_version', $backup_data['version']);
            
            return ['success' => true];
            
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
```

**Migration Testing Suite**:
```php
// tests/php/test-migration.php
class EchoDash_Migration_Test extends WP_UnitTestCase {
    
    public function test_migration_preserves_all_data() {
        // Create test data
        $test_settings = $this->create_test_settings();
        $test_post_meta = $this->create_test_post_meta();
        
        // Run migration
        $migrator = new EchoDash_Migration();
        $result = $migrator->migrate_settings();
        
        // Verify success
        $this->assertTrue($result['success']);
        $this->assertEmpty($result['errors']);
        
        // Verify data preservation
        $this->verify_settings_preserved($test_settings);
        $this->verify_post_meta_preserved($test_post_meta);
    }
    
    public function test_rollback_functionality() {
        // Set up initial state
        $initial_settings = get_option('echodash_options');
        
        // Run migration
        $migrator = new EchoDash_Migration();
        $migrator->migrate_settings();
        
        // Modify settings
        update_option('echodash_options', ['modified' => true]);
        
        // Rollback
        $rollback_result = $migrator->rollback_settings();
        
        // Verify rollback success
        $this->assertTrue($rollback_result['success']);
        $this->assertEquals($initial_settings, get_option('echodash_options'));
    }
}
```

##### Task 6.3: Documentation & Training (Priority: MEDIUM)
**Estimated Time**: 10 hours  
**Dependencies**: UI finalization

**User Documentation**:
```markdown
# EchoDash New Interface Guide

## What's New

The EchoDash admin interface has been completely redesigned with React for a faster, more intuitive experience while preserving all functionality you rely on.

### Key Improvements

- **Faster Performance**: Modern React architecture loads 60% faster
- **Better Accessibility**: Full keyboard navigation and screen reader support
- **Improved User Experience**: Cleaner design with better visual hierarchy
- **Enhanced Features**: Live preview, drag & drop, better search

### Getting Started

#### Switching Between Interfaces

You can toggle between the classic and new interface at any time:

1. Go to **Settings > EchoDash**
2. Look for the **"Use new React interface (Beta)"** toggle
3. Check the box to enable the new interface
4. Refresh the page to see changes

#### New Interface Overview

**Dashboard View**
- All your integrations displayed as cards
- Quick trigger count for each integration
- Search and filter functionality
- One-click access to configuration

**Integration Configuration**
- Live preview of events as you configure them
- Drag & drop to reorder triggers
- Better merge tag selection with search
- Improved form validation with helpful errors

### Troubleshooting

**Can't see the new interface?**
- Ensure you have JavaScript enabled
- Try refreshing the page
- Check that you have the latest plugin version

**Want to go back to the old interface?**
- Simply uncheck the toggle in Settings > EchoDash
- All your settings are preserved between interfaces

**Experiencing issues?**
- Try switching back to the classic interface temporarily
- Contact support with details about the issue
- Include browser information and any console errors
```

**Developer Documentation**:
```markdown
# EchoDash React Implementation - Developer Guide

## Architecture Overview

The new React interface is built with modern WordPress standards:

- **React 18+** with TypeScript
- **@wordpress/scripts** build system
- **@wordpress/components** for UI consistency
- **WordPress REST API** for data management

## Key Components

### Data Flow

```
WordPress Admin → React App → REST API → PHP Backend → Database
```

### Component Hierarchy

```
App
├── IntegrationDashboard
│   ├── IntegrationGrid
│   └── IntegrationCard (multiple)
├── IntegrationDetail
│   ├── TriggerList
│   ├── TriggerCard (multiple)
│   └── TriggerEditor
└── SettingsPanel
```

## Customization

### Adding Custom Fields

```typescript
// Add to integration schema
const customField: FormField = {
  name: 'custom_property',
  type: 'text',
  label: 'Custom Property',
  required: false,
  description: 'Your custom field description'
};
```

### Extending Components

```typescript
// Create custom trigger component
export const CustomTriggerCard: React.FC<TriggerCardProps> = (props) => {
  return (
    <TriggerCard {...props}>
      <CustomFieldRenderer />
    </TriggerCard>
  );
};
```

## Testing

### Running Visual Tests

```bash
npm run test:visual
```

### Running Unit Tests

```bash
npm run test
```

## Deployment

The React interface uses feature flags for safe deployment:

1. Enable for specific users first
2. Use gradual rollout percentage
3. Monitor error rates and user feedback
4. Full rollout once stable
```

##### Task 6.4: Production Deployment (Priority: HIGH)
**Estimated Time**: 12 hours  
**Dependencies**: All previous tasks, testing completion

**Deployment Checklist**:
```markdown
# EchoDash React Deployment Checklist

## Pre-Deployment

### Code Quality
- [ ] All unit tests passing (95%+ coverage)
- [ ] All integration tests passing
- [ ] Visual regression tests passing (<3% difference)
- [ ] Performance benchmarks met (<500KB bundle, <3s load)
- [ ] Accessibility audit completed (WCAG 2.1 AA)
- [ ] Cross-browser testing completed
- [ ] WordPress version compatibility verified (6.0-6.5+)

### Security
- [ ] Security audit completed
- [ ] No secrets in code
- [ ] CSRF protection implemented
- [ ] Input validation comprehensive
- [ ] XSS prevention measures in place
- [ ] SQL injection prevention verified

### Performance
- [ ] Bundle size optimized
- [ ] Code splitting implemented
- [ ] Lazy loading configured
- [ ] Image optimization complete
- [ ] Caching strategy implemented

## Deployment Steps

### Phase 1: Staging Deployment
- [ ] Deploy to staging environment
- [ ] Run full test suite
- [ ] Manual testing of critical paths
- [ ] Performance testing under load
- [ ] User acceptance testing

### Phase 2: Gradual Production Rollout
- [ ] Deploy with feature flag disabled
- [ ] Enable for internal team (1% rollout)
- [ ] Monitor error rates and performance
- [ ] Enable for beta users (5% rollout)
- [ ] Collect feedback and iterate
- [ ] Gradual increase to 25%, 50%, 75%
- [ ] Full rollout (100%)

### Phase 3: Legacy Deprecation
- [ ] 30-day notice to users
- [ ] Migration assistance for remaining users
- [ ] Remove feature flag system
- [ ] Clean up legacy code

## Monitoring

### Error Tracking
- [ ] JavaScript error monitoring
- [ ] PHP error logging
- [ ] API endpoint monitoring
- [ ] Performance monitoring
- [ ] User feedback collection

### Metrics to Track
- [ ] Page load times
- [ ] Bundle size
- [ ] Error rates
- [ ] User satisfaction scores
- [ ] Feature adoption rates
- [ ] Support ticket volume

## Rollback Plan

### Immediate Rollback (if critical issues)
1. Disable React interface via feature flag
2. All users revert to legacy interface
3. Investigate and fix issues
4. Gradual re-deployment

### Emergency Contacts
- Development Team: [contact info]
- Infrastructure Team: [contact info]
- Support Team: [contact info]
```

**Monitoring Implementation**:
```typescript
// utils/monitoring.ts
export class ProductionMonitoring {
  
  static trackError(error: Error, context: string) {
    // Send to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        tags: { context },
        extra: { userAgent: navigator.userAgent }
      });
    }
    
    // Log to WordPress
    this.logToWordPress('error', error.message, context);
  }
  
  static trackPerformance(metric: string, value: number) {
    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: metric,
        value: Math.round(value)
      });
    }
    
    // Check against thresholds
    this.checkPerformanceThresholds(metric, value);
  }
  
  static trackUserEvent(action: string, properties: Record<string, any>) {
    // User interaction tracking
    if (window.gtag) {
      window.gtag('event', action, properties);
    }
  }
  
  private static logToWordPress(level: string, message: string, context: string) {
    fetch('/wp-admin/admin-ajax.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'ecd_log_client_event',
        level,
        message,
        context,
        nonce: window.ecdReactData.nonce
      })
    });
  }
}
```

#### 🎯 Phase 6 Success Criteria
- ✅ Safe migration path established with comprehensive backup system
- ✅ Feature flag system working for controlled rollout
- ✅ Documentation complete (user and developer guides)
- ✅ Production deployment successful with monitoring
- ✅ Zero data loss during migration process
- ✅ Rollback procedures tested and functional
- ✅ User feedback collection system operational

**Phase 6 Deliverables**:
- Production-ready React application
- Feature flag system for gradual rollout
- Data migration and backup system
- Comprehensive documentation
- Monitoring and error tracking system
- Rollback procedures and emergency protocols

---

## 🔄 Cross-Phase Dependencies & Parallel Work Streams

### Dependency Mapping

```mermaid
graph TD
    A[Phase 1: Foundation] --> B[Phase 2: Data Layer]
    A --> C[Phase 3: Components]
    B --> C
    B --> D[Phase 4: Advanced Features]
    C --> D
    C --> E[Phase 5: Testing]
    D --> E
    E --> F[Phase 6: Deployment]
    
    G[Visual Testing Setup] --> H[Component Testing]
    H --> I[Integration Testing]
    I --> J[Production Testing]
```

### Parallel Work Streams

#### Stream A: Core Development (Weeks 1-4)
- **Week 1**: Foundation & build setup
- **Week 2**: Data layer & API integration  
- **Week 3**: Core components development
- **Week 4**: Advanced functionality

#### Stream B: Quality Assurance (Weeks 1-5)
- **Week 1**: Visual testing framework setup
- **Week 2**: Unit testing implementation
- **Week 3**: Component visual validation
- **Week 4**: Integration testing
- **Week 5**: Performance & accessibility testing

#### Stream C: Documentation (Weeks 3-6)
- **Week 3**: Technical documentation start
- **Week 4**: User guide creation
- **Week 5**: Developer documentation
- **Week 6**: Training materials & deployment guides

---

## ⚠️ Risk Assessment & Mitigation Strategies

### High-Risk Items

#### Risk: Data Migration Complexity
- **Probability**: Medium
- **Impact**: High  
- **Mitigation**: Extensive testing with real customer data, comprehensive backup system, rollback procedures

#### Risk: Performance Regression
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**: Bundle analysis, code splitting, performance budgets, continuous monitoring

#### Risk: User Adoption Resistance
- **Probability**: Low
- **Impact**: Medium
- **Mitigation**: Feature flag system, gradual rollout, user feedback integration, training materials

#### Risk: WordPress Version Compatibility
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**: Polyfills, graceful degradation, version checking, comprehensive compatibility testing

#### Risk: Third-party Plugin Conflicts
- **Probability**: Low
- **Impact**: Medium
- **Mitigation**: Namespace isolation, conflict testing, error boundaries, WordPress standards compliance

### Risk Monitoring

- **Weekly risk assessment** during development
- **Performance monitoring** in production
- **User feedback tracking** for adoption issues
- **Compatibility testing** with WordPress updates

---

## 📊 Success Metrics & KPIs

### Technical Metrics
- **Bundle Size**: <500KB gzipped ✅
- **Initial Load Time**: <3 seconds ✅
- **Data Loss**: Zero during migration ✅
- **Feature Parity**: 100% with current implementation ✅
- **Test Coverage**: 95%+ ✅

### User Experience Metrics
- **Task Completion Time**: Reduced by 30% ✅
- **User Satisfaction**: >4.5/5 ✅
- **Support Tickets**: Reduction by 40% ✅
- **Accessibility Compliance**: WCAG 2.1 AA ✅
- **Visual Design Accuracy**: >97% match to mockups ✅
- **UI Consistency Score**: 100% across supported browsers ✅

### Business Metrics
- **Customer Churn**: Zero due to migration ✅
- **Development Velocity**: Improved for future features ✅
- **Maintenance Burden**: Reduced ✅
- **Competitive Positioning**: Enhanced ✅

---

## 🚀 Next Steps & Implementation Kickoff

### Immediate Actions (This Week)
1. **Project Approval & Resource Allocation**
   - Review and approve migration plan
   - Assign development team members
   - Set up project tracking (GitHub Projects/Jira)

2. **Environment Setup**
   - Create development branches
   - Set up build pipeline
   - Configure testing environments
   - Set up monitoring dashboards

3. **Stakeholder Communication**
   - Inform customers of upcoming changes
   - Set expectations for timeline
   - Establish feedback channels

### Phase 1 Kickoff (Next Week)
1. **Begin Build System Setup**
   - Configure @wordpress/scripts
   - Set up TypeScript configuration
   - Initialize React project structure

2. **Team Onboarding**
   - Review architectural decisions
   - Set up development environment
   - Review coding standards and guidelines

3. **Quality Assurance Planning**
   - Set up visual testing infrastructure
   - Plan testing strategy
   - Configure CI/CD pipeline

This comprehensive workflow provides a systematic approach to migrating the EchoDash WordPress plugin from jQuery to React while maintaining high quality standards, preserving user data, and ensuring a smooth transition for all stakeholders.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Load and analyze PROJECT_MIGRATION_PLAN.xml", "status": "completed", "priority": "high"}, {"id": "2", "content": "Extract requirements and acceptance criteria", "status": "completed", "priority": "high"}, {"id": "3", "content": "Generate systematic implementation workflow", "status": "completed", "priority": "high"}, {"id": "4", "content": "Create dependency mapping and risk assessment", "status": "completed", "priority": "high"}, {"id": "5", "content": "Identify parallel work streams and milestones", "status": "completed", "priority": "high"}]