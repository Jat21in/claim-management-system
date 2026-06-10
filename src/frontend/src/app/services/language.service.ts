import { Injectable, signal, effect, inject } from '@angular/core';

export type Language = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn';

export interface Translations {
  [key: string]: {
    en: string;
    hi: string;
    mr: string;
    ta: string;
    te: string;
    bn: string;
  };
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private currentLang = signal<Language>('en');
  private translations: Translations = {};

  constructor() {
    this.loadTranslations();
    const savedLang = localStorage.getItem('preferredLanguage') as Language;
    if (savedLang && this.isValidLanguage(savedLang)) {
      this.currentLang.set(savedLang);
    }
    effect(() => {
      localStorage.setItem('preferredLanguage', this.currentLang());
    });
  }

  private loadTranslations() {
    this.translations = {
      // Navigation
      'nav.dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड', mr: 'डॅशबोर्ड', ta: 'டாஷ்போர்டு', te: 'డ్యాష్బోర్డ్', bn: 'ড্যাশবোর্ড' },
      'nav.claims': { en: 'Claims', hi: 'दावे', mr: 'दावे', ta: 'க்ளைம்கள்', te: 'క్లెయిమ్లు', bn: 'দাবি' },
      'nav.policies': { en: 'Policies', hi: 'पॉलिसियाँ', mr: 'पॉलिसी', ta: 'கொள்கைகள்', te: 'పాలసీలు', bn: 'পলিসি' },
      'nav.profile': { en: 'Profile', hi: 'प्रोफाइल', mr: 'प्रोफाइल', ta: 'சுயவிவரம்', te: 'ప్రొఫైల్', bn: 'প্রোফাইল' },
      
      // Common Actions
      'action.submit': { en: 'Submit', hi: 'जमा करें', mr: 'सबमिट करा', ta: 'சமர்ப்பி', te: 'సమర్పించు', bn: 'জমা দিন' },
      'action.cancel': { en: 'Cancel', hi: 'रद्द करें', mr: 'रद्द करा', ta: 'ரத்து', te: 'రద్దు', bn: 'বাতিল' },
      'action.save': { en: 'Save', hi: 'सहेजें', mr: 'जतन करा', ta: 'சேமி', te: 'సేవ్', bn: 'সংরক্ষণ' },
      'action.delete': { en: 'Delete', hi: 'हटाएँ', mr: 'हटवा', ta: 'நீக்கு', te: 'తొలగించు', bn: 'মুছুন' },
      'action.edit': { en: 'Edit', hi: 'संपादित करें', mr: 'संपादित करा', ta: 'திருத்து', te: 'సవరించు', bn: 'সম্পাদনা' },
      'action.view': { en: 'View', hi: 'देखें', mr: 'पहा', ta: 'காண்க', te: 'చూడండి', bn: 'দেখুন' },
      
      // Claims
      'claim.submit': { en: 'Submit Claim', hi: 'दावा जमा करें', mr: 'दावा सबमिट करा', ta: 'க்ளைம் சமர்ப்பி', te: 'క్లెయిమ్ సమర్పించు', bn: 'দাবি জমা দিন' },
      'claim.amount': { en: 'Claim Amount', hi: 'दावा राशि', mr: 'दावा रक्कम', ta: 'க்ளைம் தொகை', te: 'క్లెయిమ్ మొత్తం', bn: 'দাবির পরিমাণ' },
      'claim.date': { en: 'Claim Date', hi: 'दावा तिथि', mr: 'दावा तारीख', ta: 'க்ளைம் தேதி', te: 'క్లెయిమ్ తేదీ', bn: 'দাবির তারিখ' },
      'claim.status.submitted': { en: 'Submitted', hi: 'जमा', mr: 'सबमिट केले', ta: 'சமர்ப்பிக்கப்பட்டது', te: 'సమర్పించబడింది', bn: 'জমা দেওয়া হয়েছে' },
      'claim.status.approved': { en: 'Approved', hi: 'स्वीकृत', mr: 'मान्य', ta: 'அங்கீகரிக்கப்பட்டது', te: 'ఆమోదించబడింది', bn: 'অনুমোদিত' },
      'claim.status.rejected': { en: 'Rejected', hi: 'अस्वीकृत', mr: 'नाकारले', ta: 'நிராகரிக்கப்பட்டது', te: 'తిరస్కరించబడింది', bn: 'প্রত্যাখ্যাত' },
      'claim.status.pending': { en: 'Pending', hi: 'लंबित', mr: 'प्रलंबित', ta: 'நிலுவையில்', te: 'పెండింగ్', bn: 'মুলতুবি' },
      'claim.status.paid': { en: 'Paid', hi: 'भुगतान किया गया', mr: 'पैसे दिले', ta: 'பணம் செலுத்தப்பட்டது', te: 'చెల్లించబడింది', bn: 'পরিশোধিত' },
      
      // Premium
      'premium.due': { en: 'Premium Due', hi: 'प्रीमियम देय', mr: 'प्रीमियम देय', ta: 'பிரீமியம் நிலுவை', te: 'ప్రీమియం బాకీ', bn: 'প্রিমিয়াম বকেয়া' },
      'premium.amount': { en: 'Premium Amount', hi: 'प्रीमियम राशि', mr: 'प्रीमियम रक्कम', ta: 'பிரீமியம் தொகை', te: 'ప్రీమియం మొత్తం', bn: 'প্রিমিয়াম পরিমাণ' },
      'premium.paid': { en: 'Premium Paid', hi: 'प्रीमियम भुगतान', mr: 'प्रीमियम भरले', ta: 'பிரீமியம் செலுத்தப்பட்டது', te: 'ప్రీమియం చెల్లించబడింది', bn: 'প্রিমিয়াম পরিশোধিত' },
      
      // Policy
      'policy.number': { en: 'Policy Number', hi: 'पॉलिसी संख्या', mr: 'पॉलिसी क्रमांक', ta: 'கொள்கை எண்', te: 'పాలసీ నంబర్', bn: 'পলিসি নম্বর' },
      'policy.coverage': { en: 'Coverage Amount', hi: 'कवरेज राशि', mr: 'कवरेज रक्कम', ta: 'கவரேஜ் தொகை', te: 'కవరేజ్ మొత్తం', bn: 'কভারেজ পরিমাণ' },
      'policy.startDate': { en: 'Start Date', hi: 'आरंभ तिथि', mr: 'सुरुवात तारीख', ta: 'தொடக்க தேதி', te: 'ప్రారంభ తేదీ', bn: 'শুরুর তারিখ' },
      'policy.endDate': { en: 'End Date', hi: 'समाप्ति तिथि', mr: 'समाप्ती तारीख', ta: 'முடிவு தேதி', te: 'ముగింపు తేదీ', bn: 'শেষ তারিখ' },
      
      // KYC
      'kyc.title': { en: 'KYC Verification', hi: 'KYC सत्यापन', mr: 'KYC सत्यापन', ta: 'KYC சரிபார்ப்பு', te: 'KYC ధృవీకరణ', bn: 'KYC যাচাইকরণ' },
      'kyc.upload': { en: 'Upload Documents', hi: 'दस्तावेज़ अपलोड करें', mr: 'कागदपत्रे अपलोड करा', ta: 'ஆவணங்களை பதிவேற்றுக', te: 'పత్రాలను అప్లోడ్ చేయండి', bn: 'ডকুমেন্ট আপলোড করুন' },
      'kyc.approved': { en: 'KYC Approved', hi: 'KYC स्वीकृत', mr: 'KYC मान्य', ta: 'KYC அங்கீகரிக்கப்பட்டது', te: 'KYC ఆమోదించబడింది', bn: 'KYC অনুমোদিত' },
      'kyc.rejected': { en: 'KYC Rejected', hi: 'KYC अस्वीकृत', mr: 'KYC नाकारले', ta: 'KYC நிராகரிக்கப்பட்டது', te: 'KYC తిరస్కరించబడింది', bn: 'KYC প্রত্যাখ্যাত' },
      
      // Hospital
      'hospital.search': { en: 'Search Hospitals', hi: 'अस्पताल खोजें', mr: 'रुग्णालय शोधा', ta: 'மருத்துவமனைகளை தேடு', te: 'ఆసుపత్రులను శోధించండి', bn: 'হাসপাতাল অনুসন্ধান করুন' },
      'hospital.cashless': { en: 'Cashless Available', hi: 'कैशलेस उपलब्ध', mr: 'कॅशलेस उपलब्ध', ta: 'பணமில்லா கிடைக்கும்', te: 'క్యాష్లెస్ అందుబాటులో ఉంది', bn: 'ক্যাশলেস উপলব্ধ' },
      
      // Errors
      'error.general': { en: 'Something went wrong', hi: 'कुछ गलत हो गया', mr: 'काहीतरी चूक झाली', ta: 'ஏதோ தவறு நடந்துவிட்டது', te: 'ఏదో పొరపాటు జరిగింది', bn: 'কিছু ভুল হয়েছে' },
      'error.network': { en: 'Network error', hi: 'नेटवर्क त्रुटि', mr: 'नेटवर्क त्रुटी', ta: 'பிணைய பிழை', te: 'నెట్వర్క్ లోపం', bn: 'নেটওয়ার্ক ত্রুটি' },
      
      // Success
      'success.saved': { en: 'Saved successfully', hi: 'सफलतापूर्वक सहेजा गया', mr: 'यशस्वीरित्या जतन केले', ta: 'வெற்றிகரமாக சேமிக்கப்பட்டது', te: 'విజయవంతంగా సేవ్ చేయబడింది', bn: 'সফলভাবে সংরক্ষিত হয়েছে' },
      'success.payment': { en: 'Payment successful', hi: 'भुगतान सफल', mr: 'पेमेंट यशस्वी', ta: 'பணம் செலுத்துதல் வெற்றிகரமானது', te: 'చెల్లింపు విజయవంతమైంది', bn: 'পেমেন্ট সফল হয়েছে' },
    };
  }

  private isValidLanguage(lang: string): lang is Language {
    return ['en', 'hi', 'mr', 'ta', 'te', 'bn'].includes(lang);
  }

  getCurrentLang(): Language {
    return this.currentLang();
  }

  setLanguage(lang: Language) {
    this.currentLang.set(lang);
  }

  translate(key: string): string {
    const translation = this.translations[key];
    if (translation) {
      return translation[this.currentLang()] || translation.en;
    }
    return key;
  }

  getAvailableLanguages(): { code: Language; name: string; flag: string }[] {
    return [
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
      { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
      { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
      { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
      { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
    ];
  }
}