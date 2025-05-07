import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/clerk-react';
import { Sparkles, Users, Settings as SettingsIcon, BadgeCheck, CreditCard } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UpgradeButton } from '@/components/premium';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('account');
  const navigate = useNavigate();
  
  // This would come from user subscription data
  const userPlan = {
    type: 'free',
    name: 'Free Plan',
    renewalDate: null,
    features: [
      'Unlimited public projects',
      'Up to 3 team members',
      'Up to 3 custom fields per entity',
      'Basic reporting',
      'Community support',
    ],
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="account" className="flex items-center">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <BadgeCheck className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account details and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" defaultValue={user?.firstName || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" defaultValue={user?.lastName || ''} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.primaryEmailAddress?.emailAddress || ''} />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your team and permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Team management is available on the Pro plan and above.
              </p>
            </CardContent>
            <CardFooter>
              <UpgradeButton />
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Your current plan and subscription details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">{userPlan.name}</h3>
                  {userPlan.renewalDate && (
                    <p className="text-sm text-muted-foreground">
                      Renews on {new Date(userPlan.renewalDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">Features included:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {userPlan.features.map((feature, index) => (
                    <li key={index} className="text-muted-foreground">{feature}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex gap-4">
                {userPlan.type === 'free' ? (
                  <UpgradeButton />
                ) : (
                  <>
                    <Button variant="outline">Manage Subscription</Button>
                    <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                      Cancel Plan
                    </Button>
                  </>
                )}
              </div>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage your payment methods and billing information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userPlan.type === 'free' ? (
                <p className="text-muted-foreground">
                  Add a payment method to upgrade to a paid plan.
                </p>
              ) : (
                <div className="border rounded-md p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6" />
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/25</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter>
              {userPlan.type !== 'free' && (
                <Button variant="outline">Add Payment Method</Button>
              )}
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View your past invoices and payment history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userPlan.type === 'free' ? (
                <p className="text-muted-foreground">
                  No billing history available for free plan.
                </p>
              ) : (
                <div className="border rounded-md divide-y">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">Invoice #1001</p>
                      <p className="text-sm text-muted-foreground">May 1, 2023</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">Invoice #1002</p>
                      <p className="text-sm text-muted-foreground">June 1, 2023</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced notification settings are available on paid plans.
              </p>
            </CardContent>
            <CardFooter>
              <UpgradeButton />
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 