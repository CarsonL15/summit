'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AnimatedCard, AnimatedCardContent, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  User, Mail, Shield, Flame, Trophy, Award,
  ChevronLeft, Save, Edit2, CheckCircle, AlertCircle
} from 'lucide-react'
import { Database } from '@/types/database'

type UserData = Database['public']['Tables']['users']['Row']
type StationData = Database['public']['Tables']['stations']['Row']

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [station, setStation] = useState<StationData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Form fields
  const [name, setName] = useState('')
  const [badgeNumber, setBadgeNumber] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      // Get current auth user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, badge_number, role, station_id, email, points, current_streak, longest_streak, last_activity_date, created_at, updated_at')
        .eq('id', authUser.id)
        .single()

      if (userError || !userData) {
        setError('Failed to load profile')
        return
      }

      setUser(userData)
      setName(userData.name)
      setBadgeNumber(userData.badge_number || '')

      // Get station info
      if (userData.station_id) {
        const { data: stationData } = await supabase
          .from('stations')
          .select('id, name, location, city, state, department, created_at, updated_at')
          .eq('id', userData.station_id)
          .single()

        if (stationData) {
          setStation(stationData)
        }
      }

    } catch (error) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          badge_number: badgeNumber.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      // Reload user data
      const { data: updatedUser } = await supabase
        .from('users')
        .select('id, name, badge_number, role, station_id, email, points, current_streak, longest_streak, last_activity_date, created_at, updated_at')
        .eq('id', user.id)
        .single()

      if (updatedUser) {
        setUser(updatedUser)
      }

      setSuccess('Profile updated successfully!')
      setIsEditing(false)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)

    } catch (error: any) {
      setError(error.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setName(user.name)
      setBadgeNumber(user.badge_number || '')
    }
    setIsEditing(false)
    setError('')
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'chief':
        return { label: 'Fire Chief', color: 'bg-fire-red/20 text-fire-red border-fire-red/30' }
      case 'admin':
        return { label: 'Administrator', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }
      case 'firefighter':
        return { label: 'Firefighter', color: 'bg-fire-gold/20 text-fire-gold border-fire-gold/30' }
      case 'clinic':
        return { label: 'Clinic Staff', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
      case 'assessor':
        return { label: 'FMS Assessor', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' }
      default:
        return { label: role, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-fire-gold animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Profile...</h2>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <AnimatedCard className="bg-white/5 border-white/10 max-w-md">
          <AnimatedCardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <p className="text-white mb-2">Failed to load profile</p>
            <p className="text-gray-400 text-sm mb-4">{error}</p>
            <Link href="/auth/login">
              <Button className="bg-fire-red hover:bg-red-700">
                Back to Login
              </Button>
            </Link>
          </AnimatedCardContent>
        </AnimatedCard>
      </div>
    )
  }

  const roleDisplay = getRoleDisplay(user.role)
  const dashboardPath = user.role === 'admin' ? '/admin' :
                        user.role === 'assessor' ? '/assessor' :
                        user.role === 'clinic' ? '/clinic' :
                        user.role === 'chief' ? '/chief' : '/firefighter'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href={dashboardPath}>
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-black/30">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white">My Profile</h1>
              </div>
            </div>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-fire-gold text-black hover:bg-yellow-600"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        {/* Success/Error Messages */}
        {success && (
          <Alert className="mb-6 bg-green-500/20 border-green-500/50 text-green-400">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 bg-red-500/20 border-red-500/50 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Profile Card */}
        <AnimatedCard className="bg-white/5 border-white/10 mb-6">
          <AnimatedCardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-fire-red/20 rounded-full">
                  <User className="h-8 w-8 text-fire-red" />
                </div>
                <div>
                  <AnimatedCardTitle className="text-2xl text-white">
                    {user.name}
                  </AnimatedCardTitle>
                  <Badge className={`mt-2 ${roleDisplay.color}`}>
                    {roleDisplay.label}
                  </Badge>
                </div>
              </div>
            </div>
          </AnimatedCardHeader>

          <AnimatedCardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase">Basic Information</h3>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Enter your name"
                  />
                ) : (
                  <div className="p-3 bg-white/5 rounded-md border border-white/10">
                    <p className="text-white">{user.name}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <div className="p-3 bg-white/5 rounded-md border border-white/10">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-white">{user.email}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="badge" className="text-gray-300">Badge Number</Label>
                {isEditing ? (
                  <Input
                    id="badge"
                    type="text"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Enter badge number"
                  />
                ) : (
                  <div className="p-3 bg-white/5 rounded-md border border-white/10">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <p className="text-white">{user.badge_number || 'Not set'}</p>
                    </div>
                  </div>
                )}
              </div>

              {station && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Station</Label>
                  <div className="p-3 bg-white/5 rounded-md border border-white/10">
                    <p className="text-white font-medium">{station.name}</p>
                    {station.location && (
                      <p className="text-sm text-gray-400 mt-1">
                        {station.location}
                        {station.city && `, ${station.city}`}
                        {station.state && `, ${station.state}`}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stats Section */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <h3 className="text-sm font-semibold text-gray-400 uppercase">Performance Stats</h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-fire-gold/10 border border-fire-gold/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-fire-gold" />
                  </div>
                  <p className="text-2xl font-bold text-white">{user.points}</p>
                  <p className="text-xs text-gray-400">Total Points</p>
                </div>

                <div className="bg-fire-red/10 border border-fire-red/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="h-5 w-5 text-fire-red" />
                  </div>
                  <p className="text-2xl font-bold text-white">{user.current_streak}</p>
                  <p className="text-xs text-gray-400">Current Streak</p>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{user.longest_streak}</p>
                  <p className="text-xs text-gray-400">Best Streak</p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {user.last_activity_date === new Date().toISOString().split('T')[0] ? 'Yes' : 'No'}
                  </p>
                  <p className="text-xs text-gray-400">Active Today</p>
                </div>
              </div>
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !name.trim()}
                  className="flex-1 bg-fire-red hover:bg-red-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={isSaving}
                  variant="outline"
                  className="flex-1 bg-white/10 text-white border-white/20 hover:bg-black/40"
                >
                  Cancel
                </Button>
              </div>
            )}
          </AnimatedCardContent>
        </AnimatedCard>

        {/* Account Information */}
        <AnimatedCard className="bg-white/5 border-white/10">
          <AnimatedCardHeader>
            <AnimatedCardTitle className="text-white">Account Information</AnimatedCardTitle>
          </AnimatedCardHeader>
          <AnimatedCardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Member Since</span>
                <span className="text-white">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Updated</span>
                <span className="text-white">
                  {new Date(user.updated_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>
      </div>
    </div>
  )
}
