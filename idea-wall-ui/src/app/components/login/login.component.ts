import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="flex align-items-center justify-content-center min-h-screen">
      <div class="surface-card p-4 shadow-2 border-round w-full lg:w-4">
        <h2 class="text-center mb-4">登录</h2>
        <form (ngSubmit)="onSubmit()">
          <div class="mb-3">
            <span class="p-float-label">
              <input id="userId" type="text" pInputText [(ngModel)]="userId" name="userId" class="w-full" />
              <label for="userId">用户ID</label>
            </span>
          </div>
          <div class="mb-3">
            <span class="p-float-label">
              <input id="password" type="password" pInputText [(ngModel)]="password" name="password" class="w-full" />
              <label for="password">密码</label>
            </span>
          </div>
          <button pButton type="submit" label="登录" class="w-full"></button>
        </form>
      </div>
    </div>
    <p-toast></p-toast>
  `,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService]
})
export class LoginComponent {
  userId: string = '';
  password: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  onSubmit(): void {
    if (!this.userId || !this.password) {
      this.messageService.add({
        severity: 'error',
        summary: '错误',
        detail: '请填写所有必填字段'
      });
      return;
    }

    this.authService.login(this.userId, this.password).subscribe({
      next: (response) => {
        this.router.navigate(['/']);
        this.messageService.add({
          severity: 'success',
          summary: '成功',
          detail: '登录成功'
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: '错误',
          detail: '登录失败，请检查用户名和密码'
        });
      }
    });
  }
} 