import { Pipe, PipeTransform } from '@angular/core';
import { Claim } from './admin-claims.component';

@Pipe({
  name: 'filterByStatus',
  standalone: true
})
export class FilterByStatusPipe implements PipeTransform {
  transform(claims: Claim[], status: string): Claim[] {
    if (!claims || !status) return [];
    return claims.filter(claim => claim.status === status);
  }
}
