import { openConfirmActionModal } from "@/components/modals/ConfirmActionModal";
import { useAddIngredient, useIngredients } from "@/hooks/useIngredients";
import { useDeleteIngredientBatch, useUpdateIngredientBatch, } from "@/hooks/useIngredientsBatches";
import { showActionError, showActionSuccess } from "@/lib/actionNotifications";
import {
    ActionIcon,
    Badge,
    Button,
    Flex,
    Group,
    Modal,
    Paper,
    rem,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
    Title
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

interface IngredientBatch {
    id: string;
    quantity: string;
    dateAdded: string;
    expiryDate: string;
    isUsed: boolean;
}

interface Ingredient {
    id: string;
    name: string;
    category: string;
    batches: IngredientBatch[];
}

interface IngredientRowItem {
    ingredientId: string;
    batchId: string;
    name: string;
    category: string;
    quantity: string;
    dateAdded: string;
    expiryDate: string;
}

const BASE_UNIT_OPTIONS = [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'g', label: 'Gram (g)' },
    { value: 'l', label: 'Liter (l)' },
    { value: 'ml', label: 'Milliliter (ml)' },
    { value: 'pcs', label: 'Pieces (pcs)' },
    { value: 'tbsp', label: 'Tablespoon (tbsp)' },
    { value: 'tsp', label: 'Teaspoon (tsp)' },
    { value: 'cup', label: 'Cup (cup)' },
    { value: 'oz', label: 'Ounce (oz)' },
    { value: 'lb', label: 'Pound (lb)' },
    { value: 'pack', label: 'Pack (pack)' },
    { value: 'can', label: 'Can (can)' },
];

const parseQuantity = (quantity: string) => {
    const trimmed = quantity.trim();
    const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?$/);

    if (!match) {
        return { value: '', unit: 'pcs' };
    }

    return {
        value: match[1],
        unit: (match[2] || 'pcs').toLowerCase(),
    };
};

export const calculateDaysInStorage = (dateAdded: string): number => {
    const added = new Date(dateAdded);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - added.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const getDaysUntilExpiry = (expiryDate: string): number => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const getExpiryStatus = (
    expiryDate: string
): { color: string; label: string; days: number } => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) return { color: "red", label: "Expired", days: Math.abs(days) };
    if (days === 0) return { color: "red", label: "Expires Today", days: 0 };
    if (days <= 3) return { color: "orange", label: `${days}d left`, days };
    if (days <= 7) return { color: "yellow", label: `${days}d left`, days };
    return { color: "green", label: `${days}d left`, days };
};

function IngredientsPage() {
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [quantityValue, setQuantityValue] = useState("");
    const [quantityUnit, setQuantityUnit] = useState<string | null>('pcs');
    const [category, setCategory] = useState<string | null>(null);
    const [dateAdded, setDateAdded] = useState<Date | null>(null);
    const [expiryDate, setExpiryDate] = useState<Date | null>(null);
    const [IngredientFormOpened, setIngredientFormOpened] = useState(false);
    const [ingredientToEdit, setIngredientToEdit] = useState<Ingredient | null>(null);
    const [batchToEdit, setBatchToEdit] = useState<{ ingredientId: string; batchId: string } | null>(null);
    const { data: ingredients = [], isLoading } = useIngredients();
    const addIngredientMutation = useAddIngredient();
    const deleteBatchMutation = useDeleteIngredientBatch();
    const updateBatchMutation = useUpdateIngredientBatch();
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const unitOptions = useMemo(() => {
        if (!quantityUnit || BASE_UNIT_OPTIONS.some((unit) => unit.value === quantityUnit)) {
            return BASE_UNIT_OPTIONS;
        }

        return [
            ...BASE_UNIT_OPTIONS,
            { value: quantityUnit, label: `${quantityUnit} (custom)` },
        ];
    }, [quantityUnit]);

    const handleOpenEditModal = (item: any) => {
        setIngredientToEdit(item);
        setBatchToEdit({ ingredientId: item.ingredientId, batchId: item.batchId });
        setName(item.name);
        const parsedQuantity = parseQuantity(item.quantity || '');
        setQuantityValue(parsedQuantity.value);
        setQuantityUnit(parsedQuantity.unit);
        setCategory(item.category);
        setDateAdded(new Date(item.dateAdded));
        setExpiryDate(new Date(item.expiryDate));
        setIngredientFormOpened(true);
    };

    const handleFormSubmit = () => {
        const errors: Record<string, string> = {};
        if (!name.trim()) errors.name = 'Ingredient name is required';
        if (!quantityValue.trim()) {
            errors.quantity = 'Quantity value is required';
        } else if (Number.isNaN(Number(quantityValue)) || Number(quantityValue) <= 0) {
            errors.quantity = 'Quantity must be a positive number';
        }
        if (!quantityUnit) errors.quantityUnit = 'Measurement type is required';
        if (!category) errors.category = 'Category is required';
        if (!dateAdded) errors.dateAdded = 'Date added is required';
        if (!expiryDate) errors.expiryDate = 'Expiry date is required';

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setFormErrors({});

        const selectedCategory = category as string;
        const serializedDateAdded = (dateAdded as Date).toISOString();
        const serializedExpiryDate = (expiryDate as Date).toISOString();
        const formattedQuantity = `${quantityValue.trim()} ${quantityUnit}`.trim();

        if (batchToEdit) {
            updateBatchMutation.mutate({
                ingredientId: batchToEdit.ingredientId,
                batchId: batchToEdit.batchId,
                payload: {
                    quantity: formattedQuantity,
                    dateAdded: serializedDateAdded,
                    expiryDate: serializedExpiryDate,
                },
            }, {
                onSuccess: () => {
                    showActionSuccess({
                        title: "Updated",
                        message: `${name} was successfully updated.`,
                    });
                },
                onError: () => {
                    showActionError({
                        title: "Update failed",
                        message: `Unable to update ${name}. Please try again.`,
                    });
                },
            });
        } else {
            addIngredientMutation.mutate({
                name,
                quantity: formattedQuantity,
                category: selectedCategory,
                dateAdded: serializedDateAdded,
                expiryDate: serializedExpiryDate,
            }, {
                onSuccess: () => {
                    showActionSuccess({
                        title: "Added",
                        message: `${name} was successfully added.`,
                    });
                },
                onError: (err: any) => {
                    const message = err?.response?.data?.message || `Unable to add ${name}. Please try again.`;
                    showActionError({
                        title: "Add failed",
                        message,
                    });
                },
            });
        }

        setName("");
        setQuantityValue("");
        setQuantityUnit('pcs');
        setCategory(null);
        setDateAdded(null);
        setExpiryDate(null);
        setIngredientToEdit(null);
        setBatchToEdit(null);
        setIngredientFormOpened(false);
    };

    const tableRows = useMemo(() => {
        if (!Array.isArray(ingredients)) return [];

        return ingredients
            .filter((ingredient) => ingredient.batches && ingredient.batches.length > 0)
            .flatMap((ingredient) =>
                ingredient.batches.map((batch) => ({
                    ingredientId: ingredient._id,
                    batchId: batch._id,
                    name: ingredient.name,
                    category: ingredient.category,
                    quantity: batch.quantity,
                    dateAdded: batch.dateAdded,
                    expiryDate: batch.expiryDate,
                }))
            );
    }, [ingredients]);

    const modalTitle = ingredientToEdit ? "Edit Ingredient" : "Add Ingredient";
    const submitButtonLabel = ingredientToEdit ? "Save Changes" : "Add Ingredient";

    const filteredIngredients = useMemo(() => {
        return tableRows.filter((item) => {
            const matchesSearch = item.name
                .toLowerCase()
                .includes(search.toLowerCase());

            const matchesCategory = selectedCategory
                ? item.category === selectedCategory
                : true;

            return matchesSearch && matchesCategory;
        });
    }, [search, selectedCategory, tableRows]);

    const handleDeleteIngredient = (ingredientId: string, batchId: string, ingredientName: string) => {
        openConfirmActionModal({
            title: "Delete ingredient batch?",
            message: `Are you sure you want to delete this batch of ${ingredientName}?`,
            confirmLabel: "Yes, Delete It",
            confirmColor: "#e54854",
            confirmIcon: <Trash2 size={18} />,
            onConfirm: () => {
                deleteBatchMutation.mutate({ ingredientId, batchId }, {
                    onSuccess: () => {
                        showActionSuccess({
                            title: "Deleted",
                            message: `${ingredientName} was successfully deleted.`,
                        });
                    },
                    onError: () => {
                        showActionError({
                            title: "Delete failed",
                            message: `Unable to delete ${ingredientName}. Please try again.`,
                        });
                    },
                });
            },
        });
    };

    const markAsUsed = (ingredientId: string, batchId: string, ingredientName: string) => {
        openConfirmActionModal({
            title: "Mark ingredient as used?",
            message: `Mark ${ingredientName} as used?`,
            confirmLabel: "Yes, Mark as Used",
            confirmColor: "#8a9a7b",
            onConfirm: () => {
                updateBatchMutation.mutate({
                    ingredientId,
                    batchId,
                    payload: { isUsed: true },
                }, {
                    onSuccess: () => {
                        showActionSuccess({
                            title: "Marked as used",
                            message: `${ingredientName} is successfully marked as used.`,
                        });
                    },
                    onError: () => {
                        showActionError({
                            title: "Update failed",
                            message: `Unable to mark ${ingredientName} as used.`,
                        });
                    },
                });
            },
        });
    };

    return (
        <Stack
            align="center"
            mih="100vh"
            w="100%"
            style={{ backgroundColor: "#f8f9f8" }}
        >
            <Stack
                w="100%"
                maw={rem(1655)}
                p="xl"
                gap="xs"
            >
                <Flex direction={{ base: 'column', lg: 'row' }} justify={"space-between"} align={{ base: 'stretch', lg: 'center' }} gap="md" mb="lg">
                    <Flex justify={"flex-start"} direction={"column"}>
                        <Title order={2} style={{ color: '#2d3319' }}>
                            My Ingredients
                        </Title>
                        <Text size="sm" c="dimmed" style={{ color: '#5a6b4f' }}>
                            Manage your pantry and track expiration dates
                        </Text>
                    </Flex>
                    <Flex justify={"flex-end"} gap={"md"} wrap="wrap" style={{ flex: 1 }}>
                        <TextInput
                            placeholder="Search ingredients..."
                            radius={"md"}
                            style={{ flex: 1, minWidth: '220px' }}
                            value={search}
                            onChange={(e) => setSearch(e.currentTarget.value)}
                        />
                        <Select placeholder="Category" data={[
                            'Protein',
                            'Dairy',
                            'Condiment',
                            'Grain',
                            'Fruit',
                            'Vegetable',
                        ]}
                            style={{ width: "100%", maxWidth: 160, minWidth: 100 }}
                            radius={"md"}
                            checkIconPosition="right"
                            clearable
                            allowDeselect
                            value={selectedCategory}
                            onChange={setSelectedCategory}
                        />
                        <Button
                            leftSection={<Plus size={18} />}
                            w={{ base: '100%', sm: '160px' }}
                            color="#6b7c5e"
                            onClick={() => setIngredientFormOpened(true)}
                        >
                            Add Ingredient
                        </Button>
                    </Flex>
                </Flex>

                <Paper
                    shadow="sm"
                    p="md"
                    radius="md"
                    style={{
                        backgroundColor: 'white',
                        border: '2px solid #8a9a7b',
                    }}
                >
                    <Table.ScrollContainer minWidth={800}>
                        <Table
                            withColumnBorders
                            styles={{
                                th: {
                                    backgroundColor: '#f8f9f8',
                                    color: '#2d3319',
                                    fontWeight: 600,
                                    padding: '12px 16px',
                                },
                                td: {
                                    padding: '12px 16px',
                                },
                            }}
                        >
                            {/* Use Mantine React Table in the future */}
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Quantity</Table.Th>
                                    <Table.Th>Ingredient</Table.Th>
                                    <Table.Th>Category</Table.Th>
                                    <Table.Th>Date Added</Table.Th>
                                    <Table.Th>Days In Storage</Table.Th>
                                    <Table.Th>Expiration Date</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                    <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>

                            <Table.Tbody>
                                {filteredIngredients.map((item: IngredientRowItem, index: number) => {
                                    const expiryStatus = getExpiryStatus(item.expiryDate);

                                    if (isLoading) {
                                        return <Text>Loading ingredients...</Text>;
                                    }

                                    return (
                                        <Table.Tr key={index}>
                                            <Table.Td>
                                                <Text size="sm" fw={500} style={{ color: '#2d3319' }}>
                                                    {item.quantity}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" fw={500} style={{ color: '#2d3319' }}>
                                                    {item.name}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge
                                                    variant="light"
                                                    color="gray"
                                                    size="sm"
                                                >
                                                    {item.category}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" c="dimmed">
                                                    {new Date(item.dateAdded).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" c="dimmed">
                                                    {calculateDaysInStorage(item.dateAdded)} days
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" c="dimmed">
                                                    {new Date(item.expiryDate).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge
                                                    variant="filled"
                                                    color={expiryStatus.color}
                                                    size="sm"
                                                >
                                                    {expiryStatus.label}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap="xs" justify="flex-end">
                                                    <Button
                                                        color="#6b7c5e"
                                                        size="xs"
                                                        onClick={() => markAsUsed(item.ingredientId, item.batchId, item.name)}
                                                    >
                                                        Mark As Used
                                                    </Button>
                                                    <ActionIcon
                                                        variant="light"
                                                        color="blue"
                                                        size="sm"
                                                        onClick={() => handleOpenEditModal(item)}
                                                    >
                                                        <Edit size={16} />
                                                    </ActionIcon>
                                                    <ActionIcon
                                                        variant="light"
                                                        color="red"
                                                        size="sm"
                                                        onClick={() => handleDeleteIngredient(item.ingredientId, item.batchId, item.name)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </ActionIcon>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    );
                                })}
                                {filteredIngredients.length === 0 && (
                                    <Table.Tr>
                                        <Table.Td colSpan={8}>
                                            <Paper
                                                style={{
                                                    backgroundColor: 'white',
                                                    border: '2px dashed #e8f0e8',
                                                    borderRadius: '10px',
                                                    textAlign: 'center',
                                                    minHeight: '200px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                <Text c="dimmed" ta="center">
                                                    No ingredients found matching your search and category selection.
                                                </Text>
                                            </Paper>
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                    </Table.ScrollContainer>
                </Paper>
                <Modal
                    opened={IngredientFormOpened}
                    onClose={() => {
                        setIngredientFormOpened(false);
                        setIngredientToEdit(null);
                        setBatchToEdit(null);
                        setName("");
                        setQuantityValue("");
                        setQuantityUnit('pcs');
                        setCategory(null);
                        setDateAdded(null);
                        setExpiryDate(null);
                        setFormErrors({});
                    }}
                    title={<Text fw={"500"} size="lg">{modalTitle}</Text>}
                    centered
                    overlayProps={{
                        backgroundOpacity: 0.55,
                        blur: 3,
                    }}
                    radius={"lg"}
                    padding={"lg"}
                >
                    <Flex direction={"column"} gap={"sm"}>
                        <TextInput
                            label="Ingredient Name"
                            placeholder="e.g., Milk"
                            value={name}
                            onChange={(e) => { setName(e.currentTarget.value); if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' })); }}
                            disabled={!!batchToEdit}
                            withAsterisk
                            error={formErrors.name}
                        />
                        <Group grow align="flex-start" wrap="wrap">
                            <TextInput
                                label="Quantity"
                                placeholder="e.g., 1"
                                type="number"
                                min="0"
                                step="0.01"
                                value={quantityValue}
                                onChange={(e) => {
                                    setQuantityValue(e.currentTarget.value);
                                    if (formErrors.quantity) setFormErrors(prev => ({ ...prev, quantity: '' }));
                                }}
                                withAsterisk
                                error={formErrors.quantity}
                            />
                            <Select
                                label="Measurement"
                                placeholder="Select unit"
                                data={unitOptions}
                                value={quantityUnit}
                                onChange={(val) => {
                                    setQuantityUnit(val);
                                    if (formErrors.quantityUnit) setFormErrors(prev => ({ ...prev, quantityUnit: '' }));
                                }}
                                withAsterisk
                                error={formErrors.quantityUnit}
                            />
                        </Group>
                        <Select
                            label="Category"
                            placeholder="Select category"
                            data={[
                                'Protein',
                                'Dairy',
                                'Condiment',
                                'Grain',
                                'Fruit',
                                'Vegetable',
                            ]}
                            value={category}
                            onChange={(val) => { setCategory(val); if (formErrors.category) setFormErrors(prev => ({ ...prev, category: '' })); }}
                            disabled={!!batchToEdit}
                            withAsterisk
                            error={formErrors.category}
                        />
                        <DatePickerInput
                            label="Date Added"
                            placeholder="Select date added"
                            value={dateAdded}
                            onChange={(val) => {
                                setDateAdded(val ? new Date(val) : null);
                                if (formErrors.dateAdded) setFormErrors(prev => ({ ...prev, dateAdded: '' }));
                            }}
                            withAsterisk
                            error={formErrors.dateAdded}
                        />
                        <DatePickerInput
                            label="Expiry Date"
                            placeholder="Select expiry date"
                            value={expiryDate}
                            onChange={(val) => {
                                setExpiryDate(val ? new Date(val) : null);
                                if (formErrors.expiryDate) setFormErrors(prev => ({ ...prev, expiryDate: '' }));
                            }}
                            withAsterisk
                            error={formErrors.expiryDate}
                        />
                        <Button
                            mt="md"
                            fullWidth
                            color="#6b7c5e"
                            loading={addIngredientMutation.isPending}
                            onClick={handleFormSubmit}
                        >
                            {submitButtonLabel}
                        </Button>
                    </Flex>
                </Modal>
            </Stack>
        </Stack >
    );
}

export default IngredientsPage;