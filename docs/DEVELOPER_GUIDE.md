# EchoDash React Implementation - Developer Guide

## Architecture Overview

The new React interface is built with modern WordPress standards and best practices:

- **React 18+** with TypeScript for type safety and modern features
- **@wordpress/scripts** build system for WordPress compatibility
- **@wordpress/components** for consistent WordPress admin UI
- **WordPress REST API** for secure data management
- **Feature flags** for safe gradual rollout

## Technology Stack

### Frontend

- **React 18.2+**: Modern React with hooks and concurrent features
- **TypeScript 5.3+**: Full type safety and IntelliSense support
- **@wordpress/components**: WordPress design system components
- **@wordpress/api-fetch**: WordPress REST API client
- **Yup**: Schema validation and form validation
- **React Testing Library**: Component testing framework

### Build System

- **@wordpress/scripts**: WordPress-optimized webpack configuration
- **Webpack 5**: Module bundling with code splitting
- **Babel**: JavaScript compilation and polyfills
- **PostCSS**: CSS processing and optimization
- **ESLint/Prettier**: Code linting and formatting

### Backend Integration

- **WordPress REST API**: Custom endpoints for React integration
- **Nonce Verification**: CSRF protection for all API calls
- **Capability Checks**: WordPress user permission system
- **Transient Caching**: Performance optimization for expensive operations

## Project Structure

```
assets/
├── src/
│   ├── components/           # React components
│   │   ├── common/          # Shared components
│   │   ├── integration/     # Integration-specific components
│   │   ├── forms/           # Form components
│   │   └── layout/          # Layout components
│   ├── hooks/               # Custom React hooks
│   │   ├── useSettings.ts   # Settings management
│   │   ├── useIntegrations.ts
│   │   ├── useAPI.ts        # API integration
│   │   └── useValidation.ts # Form validation
│   ├── services/            # API and external services
│   │   ├── api.ts           # API client
│   │   ├── wordpress.ts     # WordPress-specific utilities
│   │   └── validation.ts    # Validation schemas
│   ├── types/               # TypeScript definitions
│   │   ├── integration.ts   # Integration types
│   │   ├── trigger.ts       # Trigger types
│   │   ├── api.ts           # API response types
│   │   └── global.d.ts      # Global type declarations
│   ├── utils/               # Utility functions
│   │   ├── helpers.ts       # General utilities
│   │   ├── performance.ts   # Performance monitoring
│   │   └── test-utils.tsx   # Testing utilities
│   └── index.tsx            # Main entry point
├── dist/                    # Build output
├── tests/                   # Test files
│   ├── integration/         # Integration tests
│   ├── visual/              # Visual regression tests
│   └── __mocks__/           # Test mocks
└── legacy/                  # Legacy jQuery files (preserved)
```

## Key Components

### Data Flow Architecture

```
WordPress Admin → React App → REST API → PHP Backend → Database
```

### Component Hierarchy

```
App (Context Providers)
├── ErrorBoundary (Error handling)
├── NotificationSystem (Toast notifications)
├── IntegrationDashboard (Main view)
│   ├── IntegrationGrid (Card layout)
│   │   └── IntegrationCard (Individual integration)
│   └── IntegrationDetail (Configuration view)
│       ├── TriggerList (List of triggers)
│       ├── TriggerCard (Individual trigger)
│       └── TriggerEditor (Configuration modal)
└── SettingsPanel (Global settings)
```

## Core Interfaces

### Integration Types

```typescript
// types/integration.ts
interface Integration {
  slug: string;
  name: string;
  icon: string;
  description: string;
  triggerCount: number;
  enabled: boolean;
  triggers: Trigger[];
  hasGlobalSettings: boolean;
  hasPostSettings: boolean;
  postTypes: string[];
  optionTypes: string[];
  dependencies: string[];
}

interface Trigger {
  id: string;
  name: string;
  description: string;
  category: string;
  hasGlobal: boolean;
  hasSingle: boolean;
  postTypes: string[];
  optionTypes: string[];
  defaultEvent: EventConfig;
  conditions: TriggerCondition[];
  priority: number;
  enabled: boolean;
}

interface EventConfig {
  name: string;
  mappings: Record<string, string>;
  conditions: EventCondition[];
  enabled: boolean;
  validation: ValidationRule[];
}
```

### API Response Types

```typescript
// types/api.ts
interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  meta?: {
    total: number;
    page: number;
    per_page: number;
  };
}

interface ErrorResponse {
  success: false;
  data: null;
  message: string;
  errors: string[];
  code: string;
}
```

## Custom Hooks

### Settings Management

```typescript
// hooks/useSettings.ts
export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch({ 
        path: '/echodash/v1/settings',
        headers: {
          'X-WP-Nonce': window.ecdReactData.nonce
        }
      });
      setSettings(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
    try {
      // Optimistic update
      setSettings(prev => ({ ...prev, ...newSettings }));
      
      const response = await apiFetch({
        path: '/echodash/v1/settings',
        method: 'POST',
        data: newSettings,
        headers: {
          'X-WP-Nonce': window.ecdReactData.nonce
        }
      });
      
      setSettings(response.data);
      return response.data;
    } catch (err) {
      // Revert on error
      fetchSettings();
      throw err;
    }
  }, [fetchSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { 
    settings, 
    loading, 
    error, 
    fetchSettings, 
    updateSettings 
  };
};
```

### API Integration

```typescript
// hooks/useAPI.ts
export const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T>(
    path: string, 
    options: RequestOptions = {}
  ): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch({
        path: `/echodash/v1${path}`,
        method: options.method || 'GET',
        data: options.data,
        headers: {
          'X-WP-Nonce': window.ecdReactData.nonce,
          ...options.headers
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'API request failed');
      }

      return response.data;
    } catch (err) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { request, loading, error };
};
```

## Performance Optimization

### Code Splitting Strategy

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

### Webpack Configuration Enhancement

```javascript
// webpack.config.js (extends @wordpress/scripts)
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

module.exports = {
  ...defaultConfig,
  optimization: {
    ...defaultConfig.optimization,
    splitChunks: {
      cacheGroups: {
        wordpress: {
          test: /[\\/]node_modules[\\/]@wordpress[\\/]/,
          name: 'wordpress',
          chunks: 'all',
          priority: 30,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 25,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 20,
        }
      }
    }
  }
};
```

### Performance Monitoring

```typescript
// utils/performance.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  public startTimer(name: string): void {
    performance.mark(`${name}-start`);
  }

  public endTimer(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    const duration = measure ? measure.duration : 0;
    
    this.recordMetric(name, duration);
    return duration;
  }

  public recordMetric(name: string, value: number, metadata?: any): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.set(name, metric);

    // Send to analytics if configured
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: name,
        value: Math.round(value)
      });
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }
}

// Usage in components
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return (props: P) => {
    const monitor = PerformanceMonitor.getInstance();
    
    useEffect(() => {
      monitor.startTimer(`component-${componentName}`);
      return () => {
        monitor.endTimer(`component-${componentName}`);
      };
    }, []);

    return <Component {...props} />;
  };
};
```

## Testing Strategy

### Unit Testing with Jest

```typescript
// components/__tests__/IntegrationCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { IntegrationCard } from '../IntegrationCard';
import { TestUtils } from '../../utils/test-utils';

describe('IntegrationCard', () => {
  const mockIntegration = TestUtils.createMockIntegration({
    slug: 'woocommerce',
    name: 'WooCommerce',
    triggerCount: 3,
    enabled: true
  });

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

  it('shows correct status indicators', () => {
    const disabledIntegration = {
      ...mockIntegration,
      enabled: false
    };

    render(
      <IntegrationCard
        integration={disabledIntegration}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });
});
```

### Integration Testing

```typescript
// tests/integration/api.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useSettings } from '../../src/hooks/useSettings';
import { TestSetup } from '../utils/test-setup';

describe('Settings API Integration', () => {
  beforeEach(() => {
    TestSetup.mockWordPressEnvironment();
  });

  it('fetches settings on mount', async () => {
    const mockSettings = { endpoint: 'https://api.echodash.com' };
    TestSetup.mockApiResponse('/echodash/v1/settings', { 
      success: true, 
      data: mockSettings 
    });

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings).toEqual(mockSettings);
  });

  it('handles API errors gracefully', async () => {
    TestSetup.mockApiError('/echodash/v1/settings', 500, 'Server Error');

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.settings).toBeNull();
  });
});
```

### Visual Regression Testing

```typescript
// tests/visual/component-validation.spec.ts
import { test, expect } from '@playwright/test';
import { VisualTester } from '../utils/visual-tester';

test.describe('Component Visual Validation', () => {
  let visualTester: VisualTester;

  test.beforeEach(async ({ page }) => {
    visualTester = new VisualTester(page);
    await page.goto('/wp-admin/options-general.php?page=echodash');
  });

  test('IntegrationGrid matches design mockup', async () => {
    await visualTester.setupIntegrationState();
    
    const result = await visualTester.compareWithMockup(
      'integration_grid',
      {
        selector: '.ecd-integration-grid',
        tolerance: 0.03,
        hideElements: ['.wp-admin-notice']
      }
    );
    
    expect(result.passed).toBe(true);
    expect(result.percentageDifference).toBeLessThan(0.03);
  });

  test('TriggerEditor modal matches mockup', async () => {
    await visualTester.openTriggerEditor();
    
    const result = await visualTester.compareWithMockup(
      'trigger_editor_modal',
      {
        selector: '.ecd-trigger-modal',
        tolerance: 0.05
      }
    );
    
    expect(result.passed).toBe(true);
  });
});
```

## WordPress Integration

### REST API Endpoints

```php
// includes/admin/class-echodash-rest-api.php
class EchoDash_REST_API extends WP_REST_Controller {
    
    public function register_routes() {
        register_rest_route('echodash/v1', '/settings', [
            'methods' => ['GET', 'POST'],
            'callback' => [$this, 'handle_settings'],
            'permission_callback' => [$this, 'check_permissions'],
            'args' => $this->get_settings_args()
        ]);
        
        register_rest_route('echodash/v1', '/integrations', [
            'methods' => 'GET',
            'callback' => [$this, 'get_integrations'],
            'permission_callback' => [$this, 'check_permissions']
        ]);

        register_rest_route('echodash/v1', '/integrations/(?P<slug>[\w-]+)', [
            'methods' => ['GET', 'PUT', 'DELETE'],
            'callback' => [$this, 'handle_integration'],
            'permission_callback' => [$this, 'check_permissions'],
            'args' => $this->get_integration_args()
        ]);
    }

    public function check_permissions($request) {
        return current_user_can('manage_options');
    }

    private function get_settings_args() {
        return [
            'endpoint' => [
                'required' => false,
                'type' => 'string',
                'format' => 'uri',
                'validate_callback' => [$this, 'validate_endpoint']
            ],
            'apiKey' => [
                'required' => false,
                'type' => 'string',
                'minLength' => 32,
                'validate_callback' => [$this, 'validate_api_key']
            ]
        ];
    }
}
```

### Asset Enqueueing

```php
// includes/admin/class-echodash-react-admin.php
public function enqueue_react_assets() {
    $asset_file = include ECHODASH_DIR_PATH . 'assets/dist/index.asset.php';
    
    // Enqueue vendor chunks first
    $this->enqueue_vendor_chunks($asset_file);
    
    // Main React application
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
        'currentUser' => wp_get_current_user(),
        'integrations' => $this->get_integrations_data(),
        'environment' => [
            'debugMode' => defined('WP_DEBUG') && WP_DEBUG,
            'isDevelopment' => defined('SCRIPT_DEBUG') && SCRIPT_DEBUG
        ],
        'features' => [
            'livePreview' => true,
            'dragAndDrop' => true,
            'bulkOperations' => true
        ]
    ]);
}

private function enqueue_vendor_chunks($asset_file) {
    // WordPress chunk
    $wordpress_js = ECHODASH_DIR_PATH . 'assets/dist/wordpress.js';
    if (file_exists($wordpress_js)) {
        wp_enqueue_script(
            'echodash-wordpress-chunk',
            ECHODASH_DIR_URL . 'assets/dist/wordpress.js',
            [],
            $asset_file['version'],
            true
        );
    }
    
    // React chunk
    $react_js = ECHODASH_DIR_PATH . 'assets/dist/react.js';
    if (file_exists($react_js)) {
        wp_enqueue_script(
            'echodash-react-chunk',
            ECHODASH_DIR_URL . 'assets/dist/react.js',
            [],
            $asset_file['version'],
            true
        );
    }
    
    // Vendors chunk
    $vendors_js = ECHODASH_DIR_PATH . 'assets/dist/vendors.js';
    if (file_exists($vendors_js)) {
        wp_enqueue_script(
            'echodash-vendors-chunk',
            ECHODASH_DIR_URL . 'assets/dist/vendors.js',
            [],
            $asset_file['version'],
            true
        );
    }
}
```

## Error Handling & Monitoring

### Error Boundaries

```typescript
// components/common/ErrorBoundary.tsx
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    this.logError(error, errorInfo);
    
    // Record performance metric
    const monitor = PerformanceMonitor.getInstance();
    monitor.recordMetric(`error-boundary-${this.props.context}`, performance.now(), {
      error: error.message,
      componentStack: errorInfo.componentStack
    });
  }

  private logError(error: Error, errorInfo: React.ErrorInfo) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: this.props.context
    };

    // Send to WordPress backend
    fetch('/wp-admin/admin-ajax.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        action: 'ecd_log_client_error',
        error_data: JSON.stringify(errorData),
        nonce: window.ecdReactData.nonce
      })
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ? (
        <this.props.fallback 
          error={this.state.error} 
          resetError={() => this.setState({ hasError: false, error: null })}
        />
      ) : (
        <DefaultErrorFallback 
          error={this.state.error}
          context={this.props.context}
        />
      );
    }

    return this.props.children;
  }
}
```

## Deployment & Build Process

### Build Scripts

```json
{
  "scripts": {
    "build": "wp-scripts build",
    "build:analyze": "ANALYZE_BUNDLE=true npm run build",
    "start": "wp-scripts start",
    "dev": "wp-scripts start",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:visual": "playwright test --config=tests/visual/playwright.config.ts",
    "lint": "wp-scripts lint-js && wp-scripts lint-style",
    "format": "wp-scripts format",
    "type-check": "tsc --noEmit"
  }
}
```

### Production Optimization

```javascript
// webpack.config.js - Production optimizations
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  ...defaultConfig,
  plugins: [
    ...defaultConfig.plugins,
    ...(isProduction ? [
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: process.env.ANALYZE_BUNDLE ? 'server' : 'disabled'
      })
    ] : [])
  ],
  optimization: {
    ...defaultConfig.optimization,
    ...(isProduction && {
      usedExports: true,
      sideEffects: false,
      minimize: true
    })
  }
};
```

## Contributing

### Development Setup

1. **Clone Repository**: `git clone <repository-url>`
2. **Install Dependencies**: `npm install`
3. **Start Development**: `npm run start`
4. **Run Tests**: `npm test`
5. **Build for Production**: `npm run build`

### Code Standards

- **TypeScript**: All new code must be TypeScript
- **ESLint**: Follow WordPress coding standards
- **Testing**: Minimum 80% test coverage for new features
- **Documentation**: Update docs for any public API changes
- **Accessibility**: WCAG 2.1 AA compliance required

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Ensure all tests pass and coverage requirements met
4. Update documentation as needed
5. Submit PR with detailed description
6. Address review feedback
7. Merge after approval

### Release Process

1. **Version Bump**: Update version in `package.json` and plugin header
2. **Changelog**: Document all changes in `CHANGELOG.md`
3. **Build**: Create production build with `npm run build`
4. **Test**: Run full test suite including visual regression tests
5. **Tag**: Create git tag for version
6. **Deploy**: Upload to WordPress.org or deploy to production

---

For more detailed information, see the individual component documentation and inline code comments.