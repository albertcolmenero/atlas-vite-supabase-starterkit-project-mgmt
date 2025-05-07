import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckIcon, XIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@clerk/clerk-react';
import { PremiumBadge } from '@/components/premium';

type PlanType = 'free' | 'pro' | 'business';

export default function PricingPage() {
  const { user } = useUser();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  // This would come from user data
  const currentPlan = 'free' as PlanType;
  
  const plans = [
    {
      name: 'Free',
      description: 'For individuals or small teams just getting started',
      price: { monthly: '$0', yearly: '$0' },
      priceValue: { monthly: 0, yearly: 0 },
      features: [
        { name: 'Unlimited public projects', included: true },
        { name: 'Up to 3 team members', included: true },
        { name: 'Up to 3 custom fields per entity', included: true },
        { name: 'Basic reporting', included: true },
        { name: 'Community support', included: true },
        { name: 'Advanced field types', included: false },
        { name: 'Unlimited custom fields', included: false },
        { name: 'Field validation rules', included: false },
        { name: 'Priority support', included: false },
      ],
      button: {
        text: 'Current Plan',
        disabled: true,
        action: () => {},
      },
    },
    {
      name: 'Pro',
      description: 'For teams that need to manage complex projects',
      price: { monthly: '$12', yearly: '$120' },
      priceValue: { monthly: 12, yearly: 120 },
      features: [
        { name: 'Everything in Free', included: true },
        { name: 'Unlimited team members', included: true },
        { name: 'Unlimited custom fields', included: true },
        { name: 'Advanced field types', included: true },
        { name: 'Field validation rules', included: true },
        { name: 'Advanced reporting', included: true },
        { name: 'Email support', included: true },
        { name: 'Custom field templates', included: false },
        { name: 'API access', included: false },
      ],
      button: {
        text: currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
        disabled: currentPlan === 'pro',
        action: () => { console.log('Upgrade to Pro') },
      },
      highlight: true,
    },
    {
      name: 'Business',
      description: 'For organizations with advanced needs',
      price: { monthly: '$29', yearly: '$290' },
      priceValue: { monthly: 29, yearly: 290 },
      features: [
        { name: 'Everything in Pro', included: true },
        { name: 'Custom field templates', included: true },
        { name: 'API access', included: true },
        { name: 'SSO authentication', included: true },
        { name: 'Custom branding', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'SLA guarantees', included: true },
        { name: 'Advanced security features', included: true },
        { name: 'Priority phone support', included: true },
      ],
      button: {
        text: currentPlan === 'business' ? 'Current Plan' : 'Upgrade to Business',
        disabled: currentPlan === 'business',
        action: () => { console.log('Upgrade to Business') },
      },
    },
  ];
  
  const savings = {
    pro: Math.round((plans[1].priceValue.monthly * 12 - plans[1].priceValue.yearly) / (plans[1].priceValue.monthly * 12) * 100),
    business: Math.round((plans[2].priceValue.monthly * 12 - plans[2].priceValue.yearly) / (plans[2].priceValue.monthly * 12) * 100),
  };
  
  return (
    <div className="container max-w-6xl mx-auto py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Scale your workspace as your team and projects grow
        </p>
      </div>
      
      <div className="flex justify-center mb-10">
        <Tabs
          defaultValue="monthly"
          value={billingCycle}
          onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')}
          className="w-[400px]"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">
              Yearly
              <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <Card key={plan.name} className={`${plan.highlight ? 'border-primary ring-1 ring-primary' : ''} flex flex-col`}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {plan.name}
                {plan.highlight && (
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-6">
                <p className="text-4xl font-bold">
                  {plan.price[billingCycle]}
                  <span className="text-lg font-normal text-muted-foreground">
                    {billingCycle === 'monthly' ? '/month' : '/year'}
                  </span>
                </p>
                {billingCycle === 'yearly' && index > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    Save {billingCycle === 'yearly' ? `${index === 1 ? savings.pro : savings.business}%` : '0%'} with annual billing
                  </p>
                )}
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature.name} className="flex items-start">
                    {feature.included ? (
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    ) : (
                      <XIcon className="h-5 w-5 text-muted-foreground mr-2 shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? '' : 'text-muted-foreground'}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className={`w-full ${plan.highlight ? 'bg-primary hover:bg-primary/90' : ''}`}
                variant={plan.highlight ? 'default' : 'outline'}
                disabled={plan.button.disabled}
                onClick={plan.button.action}
              >
                {plan.button.text}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-lg mb-2">Can I change plans later?</h3>
            <p className="text-muted-foreground">Yes, you can upgrade, downgrade or cancel your plan at any time from your account settings.</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-lg mb-2">Is there a trial period for paid plans?</h3>
            <p className="text-muted-foreground">All paid plans come with a 14-day free trial. No credit card required to start.</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-lg mb-2">What payment methods do you accept?</h3>
            <p className="text-muted-foreground">We accept all major credit cards, PayPal, and some regional payment methods.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 