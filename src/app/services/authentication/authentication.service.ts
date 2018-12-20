import { Injectable } from '@angular/core';
import {Observable, throwError} from 'rxjs';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {catchError, map} from 'rxjs/operators';
import {ApiService} from '../api/api.service';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  authUrl: string = '/auth/tokens';
  userData: any;

  constructor(private http: HttpClient,
              private apiService: ApiService,
              private router: Router) {
  }

  loginUser(userData: { email: string, password: string }): Observable<any> {
    const hashedCredentials = btoa(userData.email + ':' + userData.password);
    localStorage.setItem('userLogged', JSON.stringify({authData: hashedCredentials}));

    return this.http.post(environment.API_ROUTE + this.authUrl, userData).pipe(
      map((data: any) => {
        if (data) {
          localStorage.setItem('userLogged', JSON.stringify(data));
          this.loadUserData();
        }

        return data;
      }),
      catchError(err => {
        if (err.status === 401) {
          localStorage.removeItem('userLogged');
        }

        return throwError(err);
      })
    );
  }

  logout(route: string = '/') {
    localStorage.removeItem('userLogged');
    this.userData = null;
    this.router.navigate([route]);
  }

  get userLogged(): any {
    return JSON.parse(localStorage.getItem('userLogged'));
  }

  loadUserData() {
    this.apiService.getResource('/api/user/me').subscribe(
      data => this.userData = data,
      err => {
        if (err.status === 401) {
          this.logout('/login');
        }
      }
    );
  }

  getUserData() {
    return this.apiService.getResource('/api/user/me');
  }
}
