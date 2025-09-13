import { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// GraphQL mutations
const PROPOSE_MAPPING = gql`
  mutation ProposeMapping($data: MappingInput!) {
    proposeMapping(data: $data) {
      id
      description
      status
    }
  }
`;

// Example transformation functions
const examples = [
  {
    name: "Basic transformation",
    description: "Extract item name without category suffix",
    code: `const nameParts = entry.name.split(' ');
const category = entry.category;
// For items like "BBQ Chicken Pizza", keep more context
let title = entry.name;
if (entry.name.endsWith(category)) {
  title = entry.name.substring(0, entry.name.length - category.length - 1);
}
return {
  title: title,
  price: entry.price,
  category: entry.category
};`,
  },
  {
    name: "Price adjustment",
    description:
      "Increases all prices by 10% and adds category prefix to titles",
    code: `return {
  title: entry.category + " - " + entry.name,
  price: Math.round((entry.price * 1.1) * 100) / 100, // 10% increase with 2 decimal places
  category: entry.category
};`,
  },
  {
    name: "Category grouping",
    description:
      "Groups categories into broader categories (e.g., combines food types)",
    code: `let broadCategory = entry.category;
// Group similar categories
if (entry.category === "Pizza" || entry.category === "Pasta") {
  broadCategory = "Italian";
} else if (entry.category === "Salad") {
  broadCategory = "Healthy Options";
}

return {
  title: entry.name,
  price: entry.price,
  category: broadCategory
};`,
  },
];

export default function CreateMapping({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [description, setDescription] = useState("");
  const [functionCode, setFunctionCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [proposeMapping, { loading }] = useMutation(PROPOSE_MAPPING, {
    onCompleted: () => {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDescription("");
        setFunctionCode("");
        if (onSuccess) onSuccess();
      }, 2000);
    },
    onError: (error) => {
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!description.trim()) {
      setError("Please provide a description.");
      return;
    }

    if (!functionCode.trim()) {
      setError("Please provide function code.");
      return;
    }

    try {
      await proposeMapping({
        variables: {
          data: {
            description,
            functionCode,
          },
        },
      });
    } catch (err) {
      // Error is handled in onError callback
    }
  };

  const loadExample = (example: (typeof examples)[0]) => {
    setDescription(example.description);
    setFunctionCode(example.code);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-3">
          Propose a Mapping Function
        </h2>
        <p className="mb-4 text-muted-foreground">
          Create a function that transforms records from the source schema to
          the target schema.
        </p>
      </div>

      <Tabs defaultValue="custom">
        <TabsList>
          <TabsTrigger value="custom">Custom Mapping</TabsTrigger>
          <TabsTrigger value="examples">Example Mappings</TabsTrigger>
        </TabsList>

        <TabsContent value="custom">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Custom Mapping Function</CardTitle>
                <CardDescription>
                  Write a JavaScript function that transforms a source record
                  (entry) into a target record.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert>
                    <AlertDescription>
                      Mapping proposal submitted successfully!
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Describe what this mapping does"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="functionCode">
                    Function Code
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Must return: {`{ title, price, category }`})
                    </span>
                  </Label>
                  <div className="relative">
                    <textarea
                      id="functionCode"
                      rows={12}
                      className="w-full min-h-[200px] font-mono text-sm p-4 rounded-md border border-input bg-transparent resize-none"
                      placeholder={`// 'entry' parameter has: { name, price, category }\n// Example:\nreturn {\n  title: entry.name,\n  price: entry.price,\n  category: entry.category\n};`}
                      value={functionCode}
                      onChange={(e) => setFunctionCode(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="ml-auto"
                  disabled={loading || success}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Submitting...
                    </>
                  ) : (
                    "Propose Mapping"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="examples">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examples.map((example, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader>
                  <CardTitle>{example.name}</CardTitle>
                  <CardDescription>{example.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="bg-muted/50 p-3 max-h-64 overflow-auto">
                    <pre className="text-xs">{example.code}</pre>
                  </div>
                </CardContent>
                <CardFooter className="pt-4">
                  <Button
                    variant="outline"
                    className="ml-auto"
                    onClick={() => loadExample(example)}
                  >
                    Use This Example
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
