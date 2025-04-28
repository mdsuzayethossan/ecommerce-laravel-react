import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AttributeValue {
  id: number;
  value: string;
}

interface Attribute {
  id: number;
  name: string;
  slug: string;
  description?: string;
  values: AttributeValue[];
}

interface Props {
  attributes: Attribute[];
}

export default function Index({ attributes }: Props) {
  return (
    <>
      <Head title="Attributes" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Attributes</h1>
        <Link href={route('attributes.create')}>
          <Button>Create Attribute</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attributes.map((attribute) => (
          <Card key={attribute.id}>
            <CardContent className="p-4 space-y-2">
              <h2 className="text-lg font-semibold">{attribute.name}</h2>
              <p className="text-gray-500 text-sm">{attribute.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {attribute.values.map((value) => (
                  <span key={value.id} className="text-xs bg-gray-200 rounded px-2 py-1">{value.value}</span>
                ))}
              </div>
              <div className="mt-4">
                <Link href={route('attributes.edit', attribute.id)}>
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
