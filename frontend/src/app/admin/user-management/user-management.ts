import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { IonicModule } from '@ionic/angular';
import { FormsModule, NgForm } from '@angular/forms';
import { ConfirmationModal } from '../../shared/confirmation-modal/confirmation-modal';
import { AdminDashboardService, User } from '../../services/dashboards/admin/admin-dashboard';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule, Sidebar, FormsModule, ConfirmationModal],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.css']
})
export class UserManagement implements OnInit, OnDestroy {
  users: User[] = [];
  loading = false;
  error: string | null = null;
  sidebarCollapsed = false;
  showCreateModal = false;
  showDeleteModal = false;
  showDetailsModal = false;

  @ViewChild('createForm') createForm!: NgForm;

  private subscriptions = new Subscription();

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;

  // Filters
  roleFilter = '';
  searchTerm = '';
  statusFilter = '';

  // User stats
  userStats = {
    totalUsers: 0,
    activeUsers: 0,
    admins: 0,
    senders: 0,
    couriers: 0,
    inactiveUsers: 0
  };

  newUser: Partial<User> = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'SENDER',
    isActive: true
  };

  editMode = false;
  selectedUserId: string | null = null;
  userIdToDelete: string | null = null;
  selectedUser: User | undefined = undefined;

  constructor(private adminDashboardService: AdminDashboardService) {}

  ngOnInit() {
    this.loadUsers();
    this.loadUserStats();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadUsers() {
    this.loading = true;
    this.error = null;

    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      ...(this.roleFilter && { role: this.roleFilter }),
      ...(this.searchTerm && { search: this.searchTerm }),
      ...(this.statusFilter && { isActive: this.statusFilter === 'active' })
    };

    const usersSubscription = this.adminDashboardService.getAllUsers(params).subscribe({
      next: (response) => {
        this.users = response.data;
        this.totalItems = response.total;
        this.totalPages = response.totalPages;
        this.loading = false;
        this.updateUserStats();
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.error = 'Failed to load users. Please try again.';
        this.loading = false;
      }
    });

    this.subscriptions.add(usersSubscription);
  }

  loadUserStats() {
    // Load all users to calculate stats (you might want a dedicated endpoint for this)
    const statsSubscription = this.adminDashboardService.getAllUsers({ limit: 1000 }).subscribe({
      next: (response) => {
        this.calculateUserStats(response.data);
      },
      error: (error) => {
        console.error('Failed to load user stats:', error);
      }
    });

    this.subscriptions.add(statsSubscription);
  }

  private calculateUserStats(allUsers: User[]) {
    this.userStats = {
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(user => user.isActive).length,
      admins: allUsers.filter(user => user.role === 'ADMIN').length,
      senders: allUsers.filter(user => user.role === 'SENDER').length,
      couriers: allUsers.filter(user => user.role === 'COURIER').length,
      inactiveUsers: allUsers.filter(user => !user.isActive).length
    };
  }

  private updateUserStats() {
    this.calculateUserStats(this.users);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadUsers();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadUsers();
  }

  onSearch() {
    this.currentPage = 1;
    this.loadUsers();
  }

  clearFilters() {
    this.roleFilter = '';
    this.searchTerm = '';
    this.statusFilter = '';
    this.currentPage = 1;
    this.loadUsers();
  }

  submitCreateUser(form: NgForm) {
    if (form.valid) {
      if (this.editMode && this.selectedUserId) {
        this.updateUser(this.selectedUserId, this.newUser);
      } else {
        this.createUser(this.newUser);
      }
      this.closeCreateModal();
      this.resetNewUser();
      if (this.createForm) {
        this.createForm.resetForm();
      }
    }
  }

  createUser(userData: Partial<User>) {
    const createSubscription = this.adminDashboardService.createUser(userData).subscribe({
      next: (createdUser) => {
        console.log('User created successfully');
        this.loadUsers();
        this.loadUserStats();
      },
      error: (err) => {
        console.error('Failed to create user:', err);
        this.error = 'Failed to create user. Please try again.';
      }
    });

    this.subscriptions.add(createSubscription);
  }

  updateUser(userId: string, userData: Partial<User>) {
    const updateSubscription = this.adminDashboardService.updateUser(userId, userData).subscribe({
      next: () => {
        console.log('User updated successfully');
        this.loadUsers();
        this.loadUserStats();
      },
      error: (err) => {
        console.error('Failed to update user:', err);
        this.error = 'Failed to update user. Please try again.';
      }
    });

    this.subscriptions.add(updateSubscription);
  }

  deleteUser(userId: string) {
    const deleteSubscription = this.adminDashboardService.deleteUser(userId).subscribe({
      next: () => {
        console.log('User deleted successfully');
        this.loadUsers();
        this.loadUserStats();
      },
      error: (err) => {
        console.error('Failed to delete user:', err);
        this.error = 'Failed to delete user. Please try again.';
      }
    });

    this.subscriptions.add(deleteSubscription);
  }

  toggleUserStatus(userId: string) {
    const toggleSubscription = this.adminDashboardService.toggleUserStatus(userId).subscribe({
      next: () => {
        console.log('User status toggled successfully');
        this.loadUsers();
        this.loadUserStats();
      },
      error: (err) => {
        console.error('Failed to toggle user status:', err);
        this.error = 'Failed to toggle user status. Please try again.';
      }
    });

    this.subscriptions.add(toggleSubscription);
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.editMode = false;
    this.selectedUserId = null;
    this.resetNewUser();
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.error = null;
  }

  openEditModal(user: User) {
    this.showCreateModal = true;
    this.editMode = true;
    this.selectedUserId = user.id;
    this.newUser = { ...user };
  }

  openDeleteModal(userId: string) {
    this.userIdToDelete = userId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.userIdToDelete = null;
  }

  confirmDeleteUser() {
    if (this.userIdToDelete) {
      this.deleteUser(this.userIdToDelete);
      this.closeDeleteModal();
    }
  }

  openDetailsModal(user: User) {
    this.selectedUser = user;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedUser = undefined;
  }

  resetNewUser() {
    this.newUser = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'SENDER',
      isActive: true
    };
  }

  get loggedInAdminName(): string {
    const userStr = localStorage.getItem('dropsecure_user');
    if (!userStr) return '';
    const user = JSON.parse(userStr);
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || '';
  }

  navItems = [
    { label: 'Dashboard', icon: 'home-outline', route: '/admin/dashboard', roles: ['ADMIN'] },
    { label: 'Packages', icon: 'cube-outline', route: '/admin/packages', roles: ['ADMIN'] },
    { label: 'Users', icon: 'people-outline', route: '/admin/users', roles: ['ADMIN'] },
    { label: 'Contact Forms', icon: 'mail-outline', route: '/admin/contacts', roles: ['ADMIN'] },
  ];

  // Utility methods
  getRoleColor(role: string): string {
    const roleColors: { [key: string]: string } = {
      'ADMIN': 'danger',
      'COURIER': 'primary',
      'SENDER': 'success'
    };
    return roleColors[role] || 'medium';
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'success' : 'danger';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getUserName(user: User): string {
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  }

  // Pagination helper
  getPaginationArray(): number[] {
    const pages = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}
