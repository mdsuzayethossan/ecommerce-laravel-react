import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Category {
  id: number;
  name: string;
  slug: string;
  parent?: Category | null;
  description?: string;
  order: number;
  image?: string | null;
}

interface Props {
  categories: Category[];
}

export default function Index({ categories }: Props) {
  return (
    <>
      <Head title="Categories" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Link href={route('categories.create')}>
          <Button>Create Category</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold">{category.name}</h2>
              {category.parent && (
                <p className="text-sm text-gray-500">Parent: {category.parent.name}</p>
              )}
              <p className="mt-2 text-sm">{category.description}</p>
              <div className="mt-4 flex gap-2">
                <Link href={route('categories.edit', category.id)}>
                  <Button size="sm" variant="outline">Edit</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
