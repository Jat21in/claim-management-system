import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService, Language } from '../../services/language.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="language-selector" (click)="$event.stopPropagation()">
      <button class="lang-trigger" (click)="toggleDropdown()">
        <span class="flag">{{ getCurrentFlag() }}</span>
        <span class="lang-name">{{ getCurrentLangName() }}</span>
        <svg class="chevron" [class.rotated]="isOpen" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      
      <div class="lang-dropdown" *ngIf="isOpen" @fadeIn>
        <button *ngFor="let lang of languages" 
                class="lang-option" 
                [class.active]="lang.code === currentLang"
                (click)="selectLanguage(lang.code)">
          <span class="flag">{{ lang.flag }}</span>
          <span class="lang-name">{{ lang.name }}</span>
          <svg *ngIf="lang.code === currentLang" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22D3EE">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .language-selector {
      position: relative;
    }
    .lang-trigger {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      background: #1F2937;
      border: 1px solid #374151;
      border-radius: 8px;
      color: #E5E7EB;
      cursor: pointer;
      transition: all 0.2s;
    }
    .lang-trigger:hover {
      background: #374151;
      border-color: #22D3EE;
    }
    .flag {
      font-size: 16px;
    }
    .lang-name {
      font-size: 12px;
    }
    .chevron {
      transition: transform 0.2s;
    }
    .chevron.rotated {
      transform: rotate(180deg);
    }
    .lang-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      background: #111827;
      border: 1px solid #1F2937;
      border-radius: 8px;
      min-width: 140px;
      z-index: 100;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .lang-option {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      background: transparent;
      border: none;
      color: #E5E7EB;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }
    .lang-option:hover {
      background: #1F2937;
    }
    .lang-option.active {
      background: rgba(34, 211, 238, 0.1);
      color: #22D3EE;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class LanguageSelectorComponent {
  private languageService = inject(LanguageService);
  
  isOpen = false;
  currentLang = this.languageService.getCurrentLang();
  languages = this.languageService.getAvailableLanguages();

  getCurrentFlag(): string {
    return this.languages.find(l => l.code === this.currentLang)?.flag || '🇬🇧';
  }

  getCurrentLangName(): string {
    return this.languages.find(l => l.code === this.currentLang)?.name || 'English';
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  selectLanguage(code: Language) {
    this.languageService.setLanguage(code);
    this.currentLang = code;
    this.isOpen = false;
  }
}