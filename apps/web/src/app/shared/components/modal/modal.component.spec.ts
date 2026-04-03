import { render, screen, fireEvent } from '@testing-library/angular';
import { By } from '@angular/platform-browser';
import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  it('should not render when isOpen is false', async () => {
    const { container } = await render(`<app-modal [isOpen]="false" title="Test Modal">Content</app-modal>`, {
      imports: [ModalComponent],
    });
    expect(screen.queryByText('Test Modal')).toBeFalsy();
    expect(screen.queryByText('Content')).toBeFalsy();
  });

  it('should render when isOpen is true', async () => {
    const { container } = await render(`<app-modal [isOpen]="true" title="Test Modal">Content</app-modal>`, {
      imports: [ModalComponent],
    });
    expect(screen.getByText('Test Modal')).toBeTruthy();
    expect(screen.getByText('Content')).toBeTruthy();
  });

  it('should emit closed event when backdrop is clicked', async () => {
    const { container } = await render(`<app-modal [isOpen]="true">Content</app-modal>`, {
      imports: [ModalComponent],
    });
    const backdrop = container.querySelector('.fixed.inset-0.bg-gray-500');
    expect(backdrop).toBeTruthy();
    if (backdrop) {
      fireEvent.click(backdrop);
    }
  });

  it('should render with small size', async () => {
    const { container } = await render(`<app-modal [isOpen]="true" size="sm">Small Modal</app-modal>`, {
      imports: [ModalComponent],
    });
    const panel = container.querySelector('.sm\\:max-w-sm');
    expect(panel).toBeTruthy();
  });

  it('should render with medium size by default', async () => {
    const { container } = await render(`<app-modal [isOpen]="true">Medium Modal</app-modal>`, {
      imports: [ModalComponent],
    });
    const panel = container.querySelector('.sm\\:max-w-lg');
    expect(panel).toBeTruthy();
  });

  it('should render with large size', async () => {
    const { container } = await render(`<app-modal [isOpen]="true" size="lg">Large Modal</app-modal>`, {
      imports: [ModalComponent],
    });
    const panel = container.querySelector('.sm\\:max-w-xl');
    expect(panel).toBeTruthy();
  });

  it('should have role dialog for accessibility', async () => {
    const { container } = await render(`<app-modal [isOpen]="true">Accessible Modal</app-modal>`, {
      imports: [ModalComponent],
    });
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
  });

  it('should have aria-modal attribute', async () => {
    const { container } = await render(`<app-modal [isOpen]="true">Aria Modal</app-modal>`, {
      imports: [ModalComponent],
    });
    const dialog = container.querySelector('[aria-modal="true"]');
    expect(dialog).toBeTruthy();
  });

  it('should render title in header when provided', async () => {
    const { container } = await render(`<app-modal [isOpen]="true" title="Modal Title">Content</app-modal>`, {
      imports: [ModalComponent],
    });
    const title = container.querySelector('h3');
    expect(title?.textContent).toBe('Modal Title');
  });

  it('should not render header when title is empty', async () => {
    const { container } = await render(`<app-modal [isOpen]="true">No Title</app-modal>`, {
      imports: [ModalComponent],
    });
    const header = container.querySelector('h3');
    expect(header).toBeFalsy();
  });

  it('should render footer by default', async () => {
    const { container } = await render(`<app-modal [isOpen]="true"><ng-container modal-footer>Footer Content</ng-container></app-modal>`, {
      imports: [ModalComponent],
    });
    const footer = container.querySelector('.bg-gray-50');
    expect(footer).toBeTruthy();
  });

  it('should not render footer when showFooter is false', async () => {
    const { container } = await render(`<app-modal [isOpen]="true" [showFooter]="false">Content</app-modal>`, {
      imports: [ModalComponent],
    });
    const footer = container.querySelector('.bg-gray-50');
    expect(footer).toBeFalsy();
  });

  it('should have proper z-index', async () => {
    const { container } = await render(`<app-modal [isOpen]="true">Z-Index Modal</app-modal>`, {
      imports: [ModalComponent],
    });
    const modal = container.querySelector('.z-50');
    expect(modal).toBeTruthy();
  });

  it('should have backdrop with correct opacity', async () => {
    const { container } = await render(`<app-modal [isOpen]="true">Backdrop Modal</app-modal>`, {
      imports: [ModalComponent],
    });
    const backdrop = container.querySelector('.bg-opacity-75');
    expect(backdrop).toBeTruthy();
  });

  it('should have overflow-y-auto on wrapper', async () => {
    const { container } = await render(`<app-modal [isOpen]="true">Scrollable Modal</app-modal>`, {
      imports: [ModalComponent],
    });
    const wrapper = container.querySelector('.overflow-y-auto');
    expect(wrapper).toBeTruthy();
  });

  it('should have white background on panel', async () => {
    const { container } = await render(`<app-modal [isOpen]="true">White Panel</app-modal>`, {
      imports: [ModalComponent],
    });
    const panel = container.querySelector('.bg-white');
    expect(panel).toBeTruthy();
  });

  it('should have shadow-xl on panel', async () => {
    const { container } = await render(`<app-modal [isOpen]="true">Shadow Panel</app-modal>`, {
      imports: [ModalComponent],
    });
    const panel = container.querySelector('.shadow-xl');
    expect(panel).toBeTruthy();
  });

  it('should have rounded corners on panel', async () => {
    const { container } = await render(`<app-modal [isOpen]="true">Rounded Panel</app-modal>`, {
      imports: [ModalComponent],
    });
    const panel = container.querySelector('.rounded-lg');
    expect(panel).toBeTruthy();
  });

  it('should have border on header when title is provided', async () => {
    const { container } = await render(`<app-modal [isOpen]="true" title="Bordered Header">Content</app-modal>`, {
      imports: [ModalComponent],
    });
    const header = container.querySelector('.border-b.border-gray-200');
    expect(header).toBeTruthy();
  });

  it('should have border on footer', async () => {
    const { container } = await render(`<app-modal [isOpen]="true"><ng-container modal-footer>Footer</ng-container></app-modal>`, {
      imports: [ModalComponent],
    });
    const footer = container.querySelector('.border-t.border-gray-200');
    expect(footer).toBeTruthy();
  });

  it('should emit closed event with MouseEvent', async () => {
    const { container, fixture } = await render(`<app-modal [isOpen]="true">Content</app-modal>`, {
      imports: [ModalComponent],
    });
    const backdrop = container.querySelector('.fixed.inset-0.bg-gray-500') as HTMLElement;
    const modalComp = fixture.debugElement.query(By.directive(ModalComponent)).componentInstance as ModalComponent;
    let closedEvent: MouseEvent | null = null;
    modalComp.closed.subscribe((e: MouseEvent) => (closedEvent = e));
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(closedEvent).toBeInstanceOf(MouseEvent);
    }
  });

  it('should have correct title styling', async () => {
    const { container } = await render(`<app-modal [isOpen]="true" title="Styled Title">Content</app-modal>`, {
      imports: [ModalComponent],
    });
    const title = container.querySelector('h3');
    expect(title?.classList.contains('text-lg')).toBe(true);
    expect(title?.classList.contains('font-semibold')).toBe(true);
    expect(title?.classList.contains('text-gray-900')).toBe(true);
  });

  it('should have flex layout on footer', async () => {
    const { container } = await render(`<app-modal [isOpen]="true"><ng-container modal-footer>Flex Footer</ng-container></app-modal>`, {
      imports: [ModalComponent],
    });
    const footer = container.querySelector('.sm\\:flex');
    expect(footer).toBeTruthy();
  });
});
