import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  signal,
  inject,
} from '@angular/core';
import { WalkthroughService, WalkthroughStep } from '../../services/walkthrough.service';

interface TooltipPosition {
  top: number;
  left: number;
  arrowSide: 'top' | 'bottom' | 'left' | 'right';
  arrowOffset: number;
}

const TOOLTIP_WIDTH = 320;
const TOOLTIP_ESTIMATED_HEIGHT = 200;
const GAP = 12;
const ARROW_SIZE = 10;

@Component({
  selector: 'app-walkthrough-tooltip',
  templateUrl: './walkthrough-tooltip.html',
})
export class WalkthroughTooltipComponent implements OnInit, OnDestroy {
  protected walkthrough = inject(WalkthroughService);

  position = signal<TooltipPosition>({ top: 100, left: 100, arrowSide: 'top', arrowOffset: 50 });
  highlightRect = signal<{ top: number; left: number; width: number; height: number } | null>(null);

  private resizeObserver: ResizeObserver | null = null;

  ngOnInit() {
    this.recalculate();
    this.resizeObserver = new ResizeObserver(() => this.recalculate());
    this.resizeObserver.observe(document.body);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  @HostListener('window:resize')
  onResize() {
    this.recalculate();
  }

  onStepChange() {
    setTimeout(() => this.recalculate(), 50);
  }

  recalculate() {
    const step = this.walkthrough.currentStep;
    if (!step) return;

    const target = document.querySelector(step.targetSelector);
    if (!target) {
      this.highlightRect.set(null);
      this.position.set({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - TOOLTIP_WIDTH / 2, arrowSide: 'top', arrowOffset: TOOLTIP_WIDTH / 2 });
      return;
    }

    const rect = target.getBoundingClientRect();
    this.highlightRect.set({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });

    const placement = step.preferredPlacement;
    this.position.set(this.computePosition(rect, placement));
  }

  private computePosition(rect: DOMRect, preferred: WalkthroughStep['preferredPlacement']): TooltipPosition {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceAbove = rect.top;
    const spaceBelow = vh - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = vw - rect.right;

    let placement = preferred;
    // Fall back if not enough room
    if (placement === 'below' && spaceBelow < TOOLTIP_ESTIMATED_HEIGHT + GAP) {
      placement = spaceAbove >= TOOLTIP_ESTIMATED_HEIGHT + GAP ? 'above' : 'right';
    }
    if (placement === 'above' && spaceAbove < TOOLTIP_ESTIMATED_HEIGHT + GAP) {
      placement = spaceBelow >= TOOLTIP_ESTIMATED_HEIGHT + GAP ? 'below' : 'right';
    }
    if (placement === 'right' && spaceRight < TOOLTIP_WIDTH + GAP) {
      placement = spaceLeft >= TOOLTIP_WIDTH + GAP ? 'left' : 'below';
    }
    if (placement === 'left' && spaceLeft < TOOLTIP_WIDTH + GAP) {
      placement = spaceRight >= TOOLTIP_WIDTH + GAP ? 'right' : 'below';
    }

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let top = 0;
    let left = 0;
    let arrowSide: TooltipPosition['arrowSide'] = 'top';
    let arrowOffset = TOOLTIP_WIDTH / 2;

    if (placement === 'below') {
      top = rect.bottom + GAP + ARROW_SIZE;
      left = Math.max(8, Math.min(vw - TOOLTIP_WIDTH - 8, centerX - TOOLTIP_WIDTH / 2));
      arrowSide = 'top';
      arrowOffset = Math.max(20, Math.min(TOOLTIP_WIDTH - 20, centerX - left));
    } else if (placement === 'above') {
      top = rect.top - TOOLTIP_ESTIMATED_HEIGHT - GAP - ARROW_SIZE;
      left = Math.max(8, Math.min(vw - TOOLTIP_WIDTH - 8, centerX - TOOLTIP_WIDTH / 2));
      arrowSide = 'bottom';
      arrowOffset = Math.max(20, Math.min(TOOLTIP_WIDTH - 20, centerX - left));
    } else if (placement === 'right') {
      top = Math.max(8, Math.min(vh - TOOLTIP_ESTIMATED_HEIGHT - 8, centerY - TOOLTIP_ESTIMATED_HEIGHT / 2));
      left = rect.right + GAP + ARROW_SIZE;
      arrowSide = 'left';
      arrowOffset = Math.max(20, Math.min(TOOLTIP_ESTIMATED_HEIGHT - 20, centerY - top));
    } else {
      top = Math.max(8, Math.min(vh - TOOLTIP_ESTIMATED_HEIGHT - 8, centerY - TOOLTIP_ESTIMATED_HEIGHT / 2));
      left = rect.left - TOOLTIP_WIDTH - GAP - ARROW_SIZE;
      arrowSide = 'right';
      arrowOffset = Math.max(20, Math.min(TOOLTIP_ESTIMATED_HEIGHT - 20, centerY - top));
    }

    return { top, left, arrowSide, arrowOffset };
  }

  next() {
    this.walkthrough.next();
    this.onStepChange();
  }

  prev() {
    this.walkthrough.prev();
    this.onStepChange();
  }

  skip() {
    this.walkthrough.skip();
  }
}
