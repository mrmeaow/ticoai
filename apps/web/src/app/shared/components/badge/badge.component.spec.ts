import { render } from '@testing-library/angular';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  it('should render with default variant', async () => {
    const { container } = await render(`<app-badge>Default</app-badge>`, {
      imports: [BadgeComponent],
    });
    const badge = container.querySelector('span');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toBe('Default');
  });

  it('should render with success variant', async () => {
    const { container } = await render(`<app-badge variant="success">Success</app-badge>`, {
      imports: [BadgeComponent],
    });
    const badge = container.querySelector('span');
    expect(badge?.classList.contains('bg-green-100')).toBe(true);
    expect(badge?.classList.contains('text-green-800')).toBe(true);
  });

  it('should render with danger variant', async () => {
    const { container } = await render(`<app-badge variant="danger">Danger</app-badge>`, {
      imports: [BadgeComponent],
    });
    const badge = container.querySelector('span');
    expect(badge?.classList.contains('bg-red-100')).toBe(true);
    expect(badge?.classList.contains('text-red-800')).toBe(true);
  });

  it('should render with warning variant', async () => {
    const { container } = await render(`<app-badge variant="warning">Warning</app-badge>`, {
      imports: [BadgeComponent],
    });
    const badge = container.querySelector('span');
    expect(badge?.classList.contains('bg-yellow-100')).toBe(true);
    expect(badge?.classList.contains('text-yellow-800')).toBe(true);
  });

  it('should render with info variant', async () => {
    const { container } = await render(`<app-badge variant="info">Info</app-badge>`, {
      imports: [BadgeComponent],
    });
    const badge = container.querySelector('span');
    expect(badge?.classList.contains('bg-blue-100')).toBe(true);
    expect(badge?.classList.contains('text-blue-800')).toBe(true);
  });

  it('should render with small size by default', async () => {
    const { container } = await render(`<app-badge>Small</app-badge>`, {
      imports: [BadgeComponent],
    });
    const badgeClass = container.querySelector('span')?.className || '';
    expect(badgeClass).toContain('text-xs');
    expect(badgeClass).toContain('px-2');
    expect(badgeClass).toContain('py-0.5');
  });

  it('should render with medium size', async () => {
    const { container } = await render(`<app-badge size="md">Medium</app-badge>`, {
      imports: [BadgeComponent],
    });
    const badgeClass = container.querySelector('span')?.className || '';
    expect(badgeClass).toContain('text-sm');
    expect(badgeClass).toContain('px-3');
    expect(badgeClass).toContain('py-1');
  });

  it('should render with priority-critical variant', async () => {
    const { container } = await render(`<app-badge variant="priority-critical">Critical</app-badge>`, {
      imports: [BadgeComponent],
    });
    const badge = container.querySelector('span');
    expect(badge?.classList.contains('bg-red-100')).toBe(true);
    expect(badge?.classList.contains('text-red-800')).toBe(true);
  });

  it('should render with priority-high variant', async () => {
    const { container } = await render(`<app-badge variant="priority-high">High</app-badge>`, {
      imports: [BadgeComponent],
    });
    const badge = container.querySelector('span');
    expect(badge?.classList.contains('bg-yellow-100')).toBe(true);
    expect(badge?.classList.contains('text-yellow-800')).toBe(true);
  });

  it('should render with priority-medium variant', async () => {
    const { container } = await render(`<app-badge variant="priority-medium">Medium</app-badge>`, {
      imports: [BadgeComponent],
    });
    const badge = container.querySelector('span');
    expect(badge?.classList.contains('bg-blue-100')).toBe(true);
    expect(badge?.classList.contains('text-blue-800')).toBe(true);
  });

  it('should render with priority-low variant', async () => {
    const { container } = await render(`<app-badge variant="priority-low">Low</app-badge>`, {
      imports: [BadgeComponent],
    });
    const badge = container.querySelector('span');
    expect(badge?.classList.contains('bg-green-100')).toBe(true);
    expect(badge?.classList.contains('text-green-800')).toBe(true);
  });

  it('should render with default variant classes', async () => {
    const { container } = await render(`<app-badge variant="default">Default</app-badge>`, {
      imports: [BadgeComponent],
    });
    const badge = container.querySelector('span');
    expect(badge?.classList.contains('bg-gray-100')).toBe(true);
    expect(badge?.classList.contains('text-gray-800')).toBe(true);
  });

  it('should have base classes applied', async () => {
    const { container } = await render(`<app-badge>Base</app-badge>`, {
      imports: [BadgeComponent],
    });
    const badge = container.querySelector('span');
    expect(badge?.classList.contains('inline-flex')).toBe(true);
    expect(badge?.classList.contains('items-center')).toBe(true);
    expect(badge?.classList.contains('font-medium')).toBe(true);
    expect(badge?.classList.contains('rounded-full')).toBe(true);
  });

  it('should project content via ng-content', async () => {
    const { container } = await render(`<app-badge><strong>Bold</strong> Content</app-badge>`, {
      imports: [BadgeComponent],
    });
    const badge = container.querySelector('span');
    expect(badge?.textContent).toContain('Bold');
    expect(badge?.textContent).toContain('Content');
  });

  it('should render with empty content', async () => {
    const { container } = await render(`<app-badge></app-badge>`, {
      imports: [BadgeComponent],
    });
    const badge = container.querySelector('span');
    expect(badge).toBeTruthy();
  });

  it('should combine variant and size classes correctly', async () => {
    const { container } = await render(`<app-badge variant="success" size="md">Combined</app-badge>`, {
      imports: [BadgeComponent],
    });
    const badgeClass = container.querySelector('span')?.className || '';
    expect(badgeClass).toContain('bg-green-100');
    expect(badgeClass).toContain('text-green-800');
    expect(badgeClass).toContain('text-sm');
    expect(badgeClass).toContain('px-3');
    expect(badgeClass).toContain('py-1');
  });
});
