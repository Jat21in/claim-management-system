import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-members',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1 class="text-2xl font-bold mb-6">Member Management</h1>

    <div *ngIf="loading" class="text-center py-10">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      <p class="mt-2">Loading members...</p>
    </div>

    <div *ngIf="!loading && members.length === 0" class="bg-gray-800 p-8 rounded-lg text-center">
      <p class="text-gray-400">No members found</p>
    </div>

    <div *ngIf="!loading && members.length > 0" class="overflow-x-auto">
      <table class="min-w-full bg-gray-800 rounded-lg overflow-hidden">
        <thead class="bg-gray-900">
          <tr>
            <th class="p-3 text-left text-gray-300">Name</th>
            <th class="p-3 text-left text-gray-300">Email</th>
            <th class="p-3 text-left text-gray-300">Role</th>
            <th class="p-3 text-left text-gray-300">Contact</th>
            <th class="p-3 text-left text-gray-300">Active Plan</th>
            <th class="p-3 text-left text-gray-300">Joined</th>
            <th class="p-3 text-left text-gray-300">Claims</th>
           </tr>
        </thead>
        <tbody>
          <tr *ngFor="let member of members" class="border-t border-gray-700 hover:bg-gray-750">
            <td class="p-3 font-medium">{{ member.fullName || member.FullName }}</td>
            <td class="p-3">{{ member.email || member.Email }}</td>
            <td class="p-3">
              <span [class]="(member.role || member.Role) === 'Admin' ? 'text-purple-400' : 'text-blue-400'">
                {{ member.role || member.Role || 'Member' }}
              </span>
            </td>
            <td class="p-3">{{ member.contactNumber || member.ContactNumber || '—' }}</td>
            <td class="p-3">
              <span *ngIf="member.activePlan" class="text-green-400">
                {{ member.activePlan.name }}
              </span>
              <span *ngIf="!member.activePlan" class="text-gray-500">No plan</span>
            </td>
            <td class="p-3">{{ (member.createdAt || member.CreatedAt) | date:'MMM d, yyyy' }}</td>
            <td class="p-3">
              <span class="bg-blue-900/50 px-2 py-1 rounded text-sm">
                {{ member.claimsCount || member.ClaimsCount || 0 }}
              </span>
            </td>
           </tr>
        </tbody>
      </table>
    </div>
  `
})
export class AdminMembersComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  members: any[] = [];

  ngOnInit() {
    this.loadMembers();
  }

  loadMembers() {
    this.loading = true;
    console.log('Fetching members...');

    this.http.get(`${environment.apiBaseUrl}/admin/members`).subscribe({
      next: (res: any) => {
        console.log('Members response:', res);

        let members = res;
        if (res && res.data) members = res.data;
        if (res && res.$values) members = res.$values;

        this.members = Array.isArray(members) ? members : [];
        console.log(`Loaded ${this.members.length} members`);

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load members:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
