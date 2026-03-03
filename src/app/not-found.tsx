'use client';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex w-full min-h-screen items-center justify-center bg-gray-50 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('notFound')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-gray-600">{t('notFoundMessage')}</p>
          <Link href="/" className="text-blue-500 hover:underline">
            {t('backToHome')}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
