export interface UserProfile {
  email?: string;
  discordId?: string;
  interests: {
    sports: boolean;
    socializing: boolean;
    gaming: boolean;
    otherInterests: string[];
  };
  onboardingComplete: boolean;
  createdAt: Date;
  lastActive: Date;
}

export class UserProfileService {
  private storageKey = 'lunchbox_user_profile';

  // Save user profile to localStorage
  saveProfile(profile: UserProfile): void {
    try {
      const profileWithDates = {
        ...profile,
        lastActive: new Date()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(profileWithDates));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }

  // Load user profile from localStorage
  loadProfile(): UserProfile | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const profile = JSON.parse(stored);
        // Convert string dates back to Date objects
        profile.createdAt = new Date(profile.createdAt);
        profile.lastActive = new Date(profile.lastActive);
        return profile;
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
    return null;
  }

  // Update specific profile fields
  updateProfile(updates: Partial<UserProfile>): UserProfile | null {
    try {
      const currentProfile = this.loadProfile();
      if (currentProfile) {
        const updatedProfile = {
          ...currentProfile,
          ...updates,
          lastActive: new Date()
        };
        this.saveProfile(updatedProfile);
        return updatedProfile;
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
    return null;
  }

  // Complete onboarding
  completeOnboarding(interests: UserProfile['interests']): UserProfile | null {
    const profile: UserProfile = {
      interests,
      onboardingComplete: true,
      createdAt: new Date(),
      lastActive: new Date()
    };
    
    this.saveProfile(profile);
    return profile;
  }

  // Add connection (email, Discord, etc.)
  addConnection(type: 'email' | 'discord', value: string): UserProfile | null {
    const currentProfile = this.loadProfile();
    if (currentProfile) {
      const updates: Partial<UserProfile> = {};
      if (type === 'email') {
        updates.email = value;
      } else if (type === 'discord') {
        updates.discordId = value;
      }
      return this.updateProfile(updates);
    }
    return null;
  }

  // Check if user has completed onboarding
  isOnboardingComplete(): boolean {
    const profile = this.loadProfile();
    return profile?.onboardingComplete || false;
  }

  // Get user interests
  getUserInterests(): UserProfile['interests'] | null {
    const profile = this.loadProfile();
    return profile?.interests || null;
  }

  // Clear user profile (for logout)
  clearProfile(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error clearing user profile:', error);
    }
  }
}

// Export a singleton instance
export const userProfileService = new UserProfileService();
