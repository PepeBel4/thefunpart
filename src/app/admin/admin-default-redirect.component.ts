import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  standalone: true,
  template: '',
})
export class AdminDefaultRedirectComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    const target = this.auth.canAccessRestaurantAdmin()
      ? ['restaurants']
      : this.auth.canAccessChainAdmin()
      ? ['chains']
      : ['/'];

    void this.router.navigate(target, { relativeTo: this.route, replaceUrl: true });
  }
}
