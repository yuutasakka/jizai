import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Family Bonding Types
interface FamilyMember {
  id: string;
  name: string;
  role: 'parent' | 'child' | 'grandparent' | 'sibling' | 'spouse' | 'other';
  avatar?: string;
  joinedDate: Date;
  lastActive: Date;
  isActive: boolean;
  devices: {
    deviceId: string;
    deviceName: string;
    platform: 'iOS' | 'Android' | 'Web';
    lastSync: Date;
  }[];
  preferences: {
    notificationLevel: 'all' | 'important' | 'minimal';
    shareByDefault: boolean;
    culturalRole: string; // e.g., '長男', '次女', etc.
  };
}

interface SharedMemorialPhoto {
  id: string;
  originalPhotoId: string;
  title: string;
  description?: string;
  createdBy: string;
  createdDate: Date;
  sharedWith: string[]; // Family member IDs
  reactions: {
    memberId: string;
    type: 'heart' | 'thanks' | 'beautiful' | 'touching' | 'pray';
    timestamp: Date;
    message?: string;
  }[];
  comments: {
    id: string;
    memberId: string;
    message: string;
    timestamp: Date;
    isPrivate: boolean;
  }[];
  viewHistory: {
    memberId: string;
    viewedAt: Date;
    duration: number;
  }[];
  permission: 'family_only' | 'extended_family' | 'private';
  tags: string[];
}

interface FamilyActivity {
  id: string;
  type: 'photo_shared' | 'photo_created' | 'reaction_added' | 'comment_added' | 'milestone_achieved' | 'family_joined';
  memberId: string;
  targetId?: string; // Photo ID, member ID, etc.
  title: string;
  description: string;
  timestamp: Date;
  isSignificant: boolean; // For important activities
  relatedMembers: string[];
}

interface FamilyGallery {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdDate: Date;
  photoIds: string[];
  collaborators: string[];
  theme: 'timeline' | 'seasonal' | 'milestone' | 'memorial' | 'celebration';
  isCollaborative: boolean;
  lastUpdated: Date;
  settings: {
    allowComments: boolean;
    allowReactions: boolean;
    autoAddNew: boolean;
    sortOrder: 'chronological' | 'quality' | 'engagement';
  };
}

interface SynchronizationStatus {
  lastFullSync: Date;
  pendingUploads: string[];
  pendingDownloads: string[];
  syncInProgress: boolean;
  conflictResolution: {
    photoId: string;
    conflicts: {
      field: string;
      localValue: any;
      remoteValue: any;
      resolution?: 'local' | 'remote' | 'merge';
    }[];
  }[];
  deviceSyncStatus: Map<string, {
    lastSync: Date;
    status: 'synced' | 'pending' | 'error' | 'offline';
    errorMessage?: string;
  }>;
}

interface FamilyInsights {
  mostActiveMembers: {
    memberId: string;
    activityCount: number;
    engagementScore: number;
  }[];
  popularPhotos: {
    photoId: string;
    reactionCount: number;
    commentCount: number;
    viewCount: number;
  }[];
  collaborationPatterns: {
    pairId: string;
    memberIds: [string, string];
    interactionCount: number;
    relationshipStrength: number;
  }[];
  engagementTrends: {
    period: 'daily' | 'weekly' | 'monthly';
    data: { date: Date; activity: number; }[];
  };
  familyMoods: {
    date: Date;
    overallMood: 'joyful' | 'reflective' | 'grateful' | 'nostalgic' | 'peaceful';
    contributingFactors: string[];
  }[];
}

interface CrossGenerationFeatures {
  storytellingMode: {
    isActive: boolean;
    narrator: string;
    currentStory: {
      photoIds: string[];
      narration: string[];
      audioRecordings?: string[];
      culturalContext?: string[];
    };
    savedStories: {
      id: string;
      title: string;
      photos: string[];
      narration: string;
      createdBy: string;
      createdDate: Date;
    }[];
  };
  culturalTraditions: {
    id: string;
    name: string;
    description: string;
    associatedPhotos: string[];
    practitionerIds: string[];
    scheduleReminders: boolean;
    nextObservance?: Date;
  }[];
  wisdomSharing: {
    messages: {
      id: string;
      fromMember: string;
      toMember?: string; // If undefined, to all family
      content: string;
      relatedPhotoId?: string;
      timestamp: Date;
      category: 'life_lesson' | 'cultural_knowledge' | 'family_history' | 'memory_sharing';
    }[];
    templates: {
      occasion: string;
      template: string;
    }[];
  };
}

interface FamilyBondingState {
  // Family Management
  familyMembers: FamilyMember[];
  currentUser: FamilyMember | null;
  familyInvites: {
    id: string;
    inviterName: string;
    inviterRole: string;
    inviteCode: string;
    expiresAt: Date;
    isAccepted: boolean;
  }[];
  
  // Shared Content
  sharedPhotos: SharedMemorialPhoto[];
  familyGalleries: FamilyGallery[];
  familyActivities: FamilyActivity[];
  
  // Synchronization
  syncStatus: SynchronizationStatus;
  
  // Analytics & Insights
  familyInsights: FamilyInsights;
  
  // Cross-Generation Features
  crossGeneration: CrossGenerationFeatures;
  
  // Settings
  familySettings: {
    familyName: string;
    primaryLanguage: 'japanese' | 'english' | 'mixed';
    culturalBackground: string[];
    privacyLevel: 'open' | 'moderate' | 'strict';
    autoSyncEnabled: boolean;
    notificationSettings: {
      newSharedPhotos: boolean;
      familyActivities: boolean;
      reactions: boolean;
      comments: boolean;
      milestones: boolean;
    };
  };
  
  // Connection Status
  connectionStatus: 'connected' | 'connecting' | 'offline' | 'error';
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface FamilyBondingActions {
  // Family Management
  inviteFamilyMember: (email: string, role: string, personalMessage?: string) => Promise<string>;
  acceptFamilyInvite: (inviteCode: string) => Promise<boolean>;
  updateMemberProfile: (memberId: string, updates: Partial<FamilyMember>) => void;
  setFamilyRole: (memberId: string, role: string) => void;
  
  // Photo Sharing
  sharePhotoWithFamily: (photoId: string, memberIds?: string[], message?: string) => Promise<SharedMemorialPhoto>;
  addReactionToPhoto: (sharedPhotoId: string, reactionType: string, message?: string) => void;
  addCommentToPhoto: (sharedPhotoId: string, comment: string, isPrivate?: boolean) => void;
  
  // Gallery Management
  createFamilyGallery: (title: string, description: string, theme: string) => FamilyGallery;
  addPhotosToGallery: (galleryId: string, photoIds: string[]) => void;
  inviteToGallery: (galleryId: string, memberIds: string[]) => void;
  
  // Synchronization
  triggerFullSync: () => Promise<void>;
  resolveConflict: (photoId: string, field: string, resolution: 'local' | 'remote' | 'merge') => void;
  checkSyncStatus: () => SynchronizationStatus;
  
  // Activity Tracking
  recordActivity: (type: string, targetId?: string, isSignificant?: boolean) => void;
  getFamilyActivityFeed: (limit?: number) => FamilyActivity[];
  
  // Cross-Generation Features
  startStorytellingSession: (photoIds: string[]) => void;
  addStoryNarration: (photoId: string, narration: string, audioRecording?: string) => void;
  shareWisdom: (content: string, category: string, relatedPhotoId?: string, targetMember?: string) => void;
  addCulturalTradition: (name: string, description: string, photoIds: string[]) => void;
  
  // Insights & Analytics
  generateFamilyInsights: () => void;
  getEngagementSummary: (timeframe: 'week' | 'month' | 'year') => any;
  
  // Settings & Preferences
  updateFamilySettings: (settings: Partial<FamilyBondingState['familySettings']>) => void;
  updateNotificationPreferences: (memberId: string, preferences: any) => void;
}

type FamilyBondingContextType = FamilyBondingState & FamilyBondingActions;

const FamilyBondingContext = createContext<FamilyBondingContextType | null>(null);

export const useFamilyBonding = () => {
  const context = useContext(FamilyBondingContext);
  if (!context) {
    throw new Error('useFamilyBonding must be used within a FamilyBondingProvider');
  }
  return context;
};

interface FamilyBondingProviderProps {
  children: React.ReactNode;
}

export const FamilyBondingProvider: React.FC<FamilyBondingProviderProps> = ({ children }) => {
  // State Management
  const [state, setState] = useState<FamilyBondingState>({
    familyMembers: [],
    currentUser: null,
    familyInvites: [],
    sharedPhotos: [],
    familyGalleries: [],
    familyActivities: [],
    syncStatus: {
      lastFullSync: new Date(),
      pendingUploads: [],
      pendingDownloads: [],
      syncInProgress: false,
      conflictResolution: [],
      deviceSyncStatus: new Map()
    },
    familyInsights: {
      mostActiveMembers: [],
      popularPhotos: [],
      collaborationPatterns: [],
      engagementTrends: { period: 'weekly', data: [] },
      familyMoods: []
    },
    crossGeneration: {
      storytellingMode: {
        isActive: false,
        narrator: '',
        currentStory: { photoIds: [], narration: [] },
        savedStories: []
      },
      culturalTraditions: [
        {
          id: 'obon',
          name: 'お盆',
          description: 'ご先祖様をお迎えする大切な期間',
          associatedPhotos: [],
          practitionerIds: [],
          scheduleReminders: true,
          nextObservance: new Date('2024-08-13')
        },
        {
          id: 'ohigan',
          name: 'お彼岸',
          description: '春分・秋分の日を中心とした一週間',
          associatedPhotos: [],
          practitionerIds: [],
          scheduleReminders: true,
          nextObservance: new Date('2024-09-20')
        }
      ],
      wisdomSharing: {
        messages: [],
        templates: [
          { occasion: '新しい遺影作成', template: 'とても心のこもった美しい作品ですね。{deceased_name}さんもきっと喜んでおられると思います。' },
          { occasion: '記念日', template: '{occasion}ですね。みんなで{deceased_name}さんを偲びましょう。' },
          { occasion: '季節の変わり目', template: '{season}になりました。{deceased_name}さんと過ごした{season}の思い出を振り返りませんか？' }
        ]
      }
    },
    familySettings: {
      familyName: '',
      primaryLanguage: 'japanese',
      culturalBackground: ['japanese'],
      privacyLevel: 'moderate',
      autoSyncEnabled: true,
      notificationSettings: {
        newSharedPhotos: true,
        familyActivities: true,
        reactions: true,
        comments: true,
        milestones: true
      }
    },
    connectionStatus: 'connected',
    networkQuality: 'good'
  });

  // Family Management
  const inviteFamilyMember = useCallback(async (
    email: string, 
    role: string, 
    personalMessage?: string
  ): Promise<string> => {
    const inviteCode = generateInviteCode();
    const newInvite = {
      id: `invite_${Date.now()}`,
      inviterName: state.currentUser?.name || '家族の方',
      inviterRole: state.currentUser?.preferences.culturalRole || role,
      inviteCode,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      isAccepted: false
    };

    setState(prev => ({
      ...prev,
      familyInvites: [...prev.familyInvites, newInvite]
    }));

    // In a real implementation, this would send an email
    console.log(`Family invite sent to ${email} with code: ${inviteCode}`);
    if (personalMessage) {
      console.log(`Personal message: ${personalMessage}`);
    }

    // Record activity
    recordActivity('family_invited', email, true);

    return inviteCode;
  }, [state.currentUser]);

  const acceptFamilyInvite = useCallback(async (inviteCode: string): Promise<boolean> => {
    const invite = state.familyInvites.find(i => i.inviteCode === inviteCode && !i.isAccepted);
    
    if (!invite || invite.expiresAt < new Date()) {
      return false;
    }

    // Create new family member (simplified - would normally require user info)
    const newMember: FamilyMember = {
      id: `member_${Date.now()}`,
      name: 'New Member', // Would be filled from registration
      role: 'other',
      joinedDate: new Date(),
      lastActive: new Date(),
      isActive: true,
      devices: [{
        deviceId: 'web_' + Date.now(),
        deviceName: 'Web Browser',
        platform: 'Web',
        lastSync: new Date()
      }],
      preferences: {
        notificationLevel: 'all',
        shareByDefault: true,
        culturalRole: '家族'
      }
    };

    setState(prev => ({
      ...prev,
      familyMembers: [...prev.familyMembers, newMember],
      familyInvites: prev.familyInvites.map(i => 
        i.id === invite.id ? { ...i, isAccepted: true } : i
      )
    }));

    recordActivity('family_joined', newMember.id, true);
    return true;
  }, [state.familyInvites]);

  // Photo Sharing
  const sharePhotoWithFamily = useCallback(async (
    photoId: string,
    memberIds?: string[],
    message?: string
  ): Promise<SharedMemorialPhoto> => {
    const sharedPhoto: SharedMemorialPhoto = {
      id: `shared_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalPhotoId: photoId,
      title: message || '大切な思い出',
      description: message,
      createdBy: state.currentUser?.id || 'unknown',
      createdDate: new Date(),
      sharedWith: memberIds || state.familyMembers.map(m => m.id),
      reactions: [],
      comments: [],
      viewHistory: [],
      permission: 'family_only',
      tags: []
    };

    setState(prev => ({
      ...prev,
      sharedPhotos: [...prev.sharedPhotos, sharedPhoto]
    }));

    recordActivity('photo_shared', photoId, true);
    
    // Generate automatic encouragement for sharing
    generateSharingEncouragement(sharedPhoto);

    return sharedPhoto;
  }, [state.currentUser, state.familyMembers]);

  const addReactionToPhoto = useCallback((
    sharedPhotoId: string, 
    reactionType: string, 
    message?: string
  ) => {
    if (!state.currentUser) return;

    const reaction = {
      memberId: state.currentUser.id,
      type: reactionType as any,
      timestamp: new Date(),
      message
    };

    setState(prev => ({
      ...prev,
      sharedPhotos: prev.sharedPhotos.map(photo => 
        photo.id === sharedPhotoId
          ? { ...photo, reactions: [...photo.reactions, reaction] }
          : photo
      )
    }));

    recordActivity('reaction_added', sharedPhotoId, false);
  }, [state.currentUser]);

  // Cross-Generation Features
  const startStorytellingSession = useCallback((photoIds: string[]) => {
    if (!state.currentUser) return;

    setState(prev => ({
      ...prev,
      crossGeneration: {
        ...prev.crossGeneration,
        storytellingMode: {
          ...prev.crossGeneration.storytellingMode,
          isActive: true,
          narrator: state.currentUser!.id,
          currentStory: {
            photoIds,
            narration: [],
            audioRecordings: [],
            culturalContext: []
          }
        }
      }
    }));

    recordActivity('storytelling_started', photoIds.join(','), true);
  }, [state.currentUser]);

  const shareWisdom = useCallback((
    content: string,
    category: string,
    relatedPhotoId?: string,
    targetMember?: string
  ) => {
    if (!state.currentUser) return;

    const wisdomMessage = {
      id: `wisdom_${Date.now()}`,
      fromMember: state.currentUser.id,
      toMember: targetMember,
      content,
      relatedPhotoId,
      timestamp: new Date(),
      category: category as any
    };

    setState(prev => ({
      ...prev,
      crossGeneration: {
        ...prev.crossGeneration,
        wisdomSharing: {
          ...prev.crossGeneration.wisdomSharing,
          messages: [...prev.crossGeneration.wisdomSharing.messages, wisdomMessage]
        }
      }
    }));

    recordActivity('wisdom_shared', relatedPhotoId, true);
  }, [state.currentUser]);

  // Synchronization
  const triggerFullSync = useCallback(async () => {
    setState(prev => ({
      ...prev,
      syncStatus: {
        ...prev.syncStatus,
        syncInProgress: true
      }
    }));

    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 2000));

    setState(prev => ({
      ...prev,
      syncStatus: {
        ...prev.syncStatus,
        lastFullSync: new Date(),
        syncInProgress: false,
        pendingUploads: [],
        pendingDownloads: []
      }
    }));
  }, []);

  // Activity Recording
  const recordActivity = useCallback((
    type: string, 
    targetId?: string, 
    isSignificant: boolean = false
  ) => {
    if (!state.currentUser) return;

    const activity: FamilyActivity = {
      id: `activity_${Date.now()}`,
      type: type as any,
      memberId: state.currentUser.id,
      targetId,
      title: generateActivityTitle(type, state.currentUser, targetId),
      description: generateActivityDescription(type, state.currentUser, targetId),
      timestamp: new Date(),
      isSignificant,
      relatedMembers: []
    };

    setState(prev => ({
      ...prev,
      familyActivities: [activity, ...prev.familyActivities].slice(0, 100) // Keep last 100 activities
    }));
  }, [state.currentUser]);

  // Helper Functions
  const generateInviteCode = (): string => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  const generateActivityTitle = (type: string, member: FamilyMember, targetId?: string): string => {
    const titles = {
      photo_shared: `${member.name}さんが思い出の写真を共有しました`,
      photo_created: `${member.name}さんが新しい遺影を作成しました`,
      reaction_added: `${member.name}さんがリアクションを送りました`,
      comment_added: `${member.name}さんがコメントを追加しました`,
      family_joined: `${member.name}さんが家族に参加しました`,
      storytelling_started: `${member.name}さんが思い出語りを始めました`,
      wisdom_shared: `${member.name}さんが知恵を分かち合いました`
    };
    
    return titles[type as keyof typeof titles] || `${member.name}さんの新しい活動`;
  };

  const generateActivityDescription = (type: string, member: FamilyMember, targetId?: string): string => {
    const descriptions = {
      photo_shared: '家族の絆を深める素敵な写真です',
      photo_created: '心のこもった美しい作品です',
      reaction_added: '温かい気持ちが伝わります',
      comment_added: '大切な思い出を分かち合っています',
      family_joined: 'ようこそ、家族の輪へ',
      storytelling_started: '大切な思い出を語り継いでいます',
      wisdom_shared: '世代を超えた知恵の共有です'
    };
    
    return descriptions[type as keyof typeof descriptions] || '';
  };

  const generateSharingEncouragement = (sharedPhoto: SharedMemorialPhoto) => {
    // Generate personalized encouragement based on sharing behavior
    const encouragements = [
      '家族と思い出を分かち合う素晴らしい行動ですね',
      'きっとご家族の皆さんも喜ばれることでしょう',
      '大切な思い出が家族の絆を深めています',
      'このような共有が家族の宝物になります'
    ];
    
    const selectedEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    
    // This would typically trigger a notification or feedback message
    console.log(`Encouragement: ${selectedEncouragement}`);
  };

  // Initialize current user (simplified)
  useEffect(() => {
    if (!state.currentUser && state.familyMembers.length === 0) {
      const initialUser: FamilyMember = {
        id: 'user_initial',
        name: 'あなた',
        role: 'parent',
        joinedDate: new Date(),
        lastActive: new Date(),
        isActive: true,
        devices: [{
          deviceId: 'web_initial',
          deviceName: 'Web Browser',
          platform: 'Web',
          lastSync: new Date()
        }],
        preferences: {
          notificationLevel: 'all',
          shareByDefault: true,
          culturalRole: '家族'
        }
      };

      setState(prev => ({
        ...prev,
        currentUser: initialUser,
        familyMembers: [initialUser]
      }));
    }
  }, [state.currentUser, state.familyMembers]);

  // Actions Implementation
  const actions: FamilyBondingActions = {
    inviteFamilyMember,
    acceptFamilyInvite,
    updateMemberProfile: (memberId, updates) => {
      setState(prev => ({
        ...prev,
        familyMembers: prev.familyMembers.map(member =>
          member.id === memberId ? { ...member, ...updates } : member
        )
      }));
    },
    setFamilyRole: (memberId, role) => {
      setState(prev => ({
        ...prev,
        familyMembers: prev.familyMembers.map(member =>
          member.id === memberId ? { ...member, role: role as any } : member
        )
      }));
    },
    sharePhotoWithFamily,
    addReactionToPhoto,
    addCommentToPhoto: (sharedPhotoId, comment, isPrivate = false) => {
      if (!state.currentUser) return;

      const newComment = {
        id: `comment_${Date.now()}`,
        memberId: state.currentUser.id,
        message: comment,
        timestamp: new Date(),
        isPrivate
      };

      setState(prev => ({
        ...prev,
        sharedPhotos: prev.sharedPhotos.map(photo =>
          photo.id === sharedPhotoId
            ? { ...photo, comments: [...photo.comments, newComment] }
            : photo
        )
      }));

      recordActivity('comment_added', sharedPhotoId);
    },
    createFamilyGallery: (title, description, theme) => {
      if (!state.currentUser) return {} as FamilyGallery;

      const gallery: FamilyGallery = {
        id: `gallery_${Date.now()}`,
        title,
        description,
        createdBy: state.currentUser.id,
        createdDate: new Date(),
        photoIds: [],
        collaborators: [state.currentUser.id],
        theme: theme as any,
        isCollaborative: true,
        lastUpdated: new Date(),
        settings: {
          allowComments: true,
          allowReactions: true,
          autoAddNew: false,
          sortOrder: 'chronological'
        }
      };

      setState(prev => ({
        ...prev,
        familyGalleries: [...prev.familyGalleries, gallery]
      }));

      return gallery;
    },
    addPhotosToGallery: (galleryId, photoIds) => {
      setState(prev => ({
        ...prev,
        familyGalleries: prev.familyGalleries.map(gallery =>
          gallery.id === galleryId
            ? { 
                ...gallery, 
                photoIds: [...new Set([...gallery.photoIds, ...photoIds])],
                lastUpdated: new Date()
              }
            : gallery
        )
      }));
    },
    inviteToGallery: (galleryId, memberIds) => {
      setState(prev => ({
        ...prev,
        familyGalleries: prev.familyGalleries.map(gallery =>
          gallery.id === galleryId
            ? { 
                ...gallery, 
                collaborators: [...new Set([...gallery.collaborators, ...memberIds])]
              }
            : gallery
        )
      }));
    },
    triggerFullSync,
    resolveConflict: (photoId, field, resolution) => {
      setState(prev => ({
        ...prev,
        syncStatus: {
          ...prev.syncStatus,
          conflictResolution: prev.syncStatus.conflictResolution.map(conflict =>
            conflict.photoId === photoId
              ? {
                  ...conflict,
                  conflicts: conflict.conflicts.map(c =>
                    c.field === field ? { ...c, resolution } : c
                  )
                }
              : conflict
          )
        }
      }));
    },
    checkSyncStatus: () => state.syncStatus,
    recordActivity,
    getFamilyActivityFeed: (limit = 20) => {
      return state.familyActivities.slice(0, limit);
    },
    startStorytellingSession,
    addStoryNarration: (photoId, narration, audioRecording) => {
      setState(prev => ({
        ...prev,
        crossGeneration: {
          ...prev.crossGeneration,
          storytellingMode: {
            ...prev.crossGeneration.storytellingMode,
            currentStory: {
              ...prev.crossGeneration.storytellingMode.currentStory,
              narration: [...prev.crossGeneration.storytellingMode.currentStory.narration, narration],
              ...(audioRecording && {
                audioRecordings: [...(prev.crossGeneration.storytellingMode.currentStory.audioRecordings || []), audioRecording]
              })
            }
          }
        }
      }));
    },
    shareWisdom,
    addCulturalTradition: (name, description, photoIds) => {
      const newTradition = {
        id: `tradition_${Date.now()}`,
        name,
        description,
        associatedPhotos: photoIds,
        practitionerIds: [state.currentUser?.id || ''],
        scheduleReminders: true
      };

      setState(prev => ({
        ...prev,
        crossGeneration: {
          ...prev.crossGeneration,
          culturalTraditions: [...prev.crossGeneration.culturalTraditions, newTradition]
        }
      }));
    },
    generateFamilyInsights: () => {
      // Generate insights based on family activity
      const insights: FamilyInsights = {
        mostActiveMembers: state.familyMembers.map(member => ({
          memberId: member.id,
          activityCount: state.familyActivities.filter(a => a.memberId === member.id).length,
          engagementScore: 85 // Simplified calculation
        })).sort((a, b) => b.activityCount - a.activityCount),
        popularPhotos: state.sharedPhotos.map(photo => ({
          photoId: photo.id,
          reactionCount: photo.reactions.length,
          commentCount: photo.comments.length,
          viewCount: photo.viewHistory.length
        })).sort((a, b) => (b.reactionCount + b.commentCount + b.viewCount) - (a.reactionCount + a.commentCount + a.viewCount)),
        collaborationPatterns: [],
        engagementTrends: { period: 'weekly', data: [] },
        familyMoods: []
      };

      setState(prev => ({
        ...prev,
        familyInsights: insights
      }));
    },
    getEngagementSummary: (timeframe) => {
      // Return engagement summary for specified timeframe
      const now = new Date();
      const timeframes = {
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000
      };
      
      const cutoff = new Date(now.getTime() - timeframes[timeframe]);
      const recentActivities = state.familyActivities.filter(a => a.timestamp >= cutoff);
      
      return {
        totalActivities: recentActivities.length,
        photoShares: recentActivities.filter(a => a.type === 'photo_shared').length,
        reactions: recentActivities.filter(a => a.type === 'reaction_added').length,
        comments: recentActivities.filter(a => a.type === 'comment_added').length,
        activeMembers: new Set(recentActivities.map(a => a.memberId)).size
      };
    },
    updateFamilySettings: (settings) => {
      setState(prev => ({
        ...prev,
        familySettings: { ...prev.familySettings, ...settings }
      }));
    },
    updateNotificationPreferences: (memberId, preferences) => {
      setState(prev => ({
        ...prev,
        familyMembers: prev.familyMembers.map(member =>
          member.id === memberId
            ? { ...member, preferences: { ...member.preferences, ...preferences } }
            : member
        )
      }));
    }
  };

  return (
    <FamilyBondingContext.Provider value={{ ...state, ...actions }}>
      {children}
    </FamilyBondingContext.Provider>
  );
};