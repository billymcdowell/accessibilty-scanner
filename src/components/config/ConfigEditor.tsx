import { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Trash2,
    Save,
    FolderOpen,
    Globe,
    FileText,
    ChevronDown,
    ChevronRight,
    Loader2,
    AlertCircle,
    GripVertical,
    KeyRound,
    MousePointer,
    Type,
    Navigation,
    Clock,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Page {
    label: string;
    url: string;
}

type SelectorMethod = 'label' | 'role' | 'placeholder' | 'text' | 'testId';

interface AuthStepSelector {
    method: SelectorMethod;
    value: string;
    roleOptions?: { name: string };
}

interface AuthStep {
    type: 'goto' | 'fill' | 'click' | 'wait';
    selector?: AuthStepSelector;
    value?: string;
    url?: string;
    timeout?: number;
}

interface Project {
    project: string;
    base_url: string;
    authenticationSteps?: AuthStep[];
    pages: Page[];
}

interface ConfigEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const STEP_TYPE_OPTIONS = [
    { value: 'goto', label: 'Navigate to URL', icon: Navigation },
    { value: 'fill', label: 'Fill Input', icon: Type },
    { value: 'click', label: 'Click Element', icon: MousePointer },
    { value: 'wait', label: 'Wait', icon: Clock },
];

const SELECTOR_METHOD_OPTIONS = [
    { value: 'label', label: 'By Label' },
    { value: 'placeholder', label: 'By Placeholder' },
    { value: 'text', label: 'By Text' },
    { value: 'testId', label: 'By Test ID' },
    { value: 'role', label: 'By Role' },
];

const ROLE_OPTIONS = [
    'button', 'checkbox', 'combobox', 'link', 'menuitem', 
    'option', 'radio', 'searchbox', 'switch', 'tab', 'textbox'
];

function AuthStepEditor({
    step,
    index,
    totalSteps,
    onChange,
    onRemove,
    onMoveUp,
    onMoveDown,
}: {
    step: AuthStep;
    index: number;
    totalSteps: number;
    onChange: (step: AuthStep) => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}) {

    return (
        <div className="group relative flex gap-2 p-3 rounded-lg bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-colors">
            <div className="flex flex-col items-center gap-1 pt-1">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 text-xs font-medium">
                    {index + 1}
                </div>
                <div className="flex flex-col gap-0.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={onMoveUp}
                        disabled={index === 0}
                    >
                        <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={onMoveDown}
                        disabled={index === totalSteps - 1}
                    >
                        <ArrowDown className="w-3 h-3" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                    <Select
                        value={step.type}
                        onValueChange={(value: AuthStep['type']) => {
                            const newStep: AuthStep = { type: value };
                            if (value === 'goto') {
                                newStep.url = step.url || '';
                            } else if (value === 'fill') {
                                newStep.selector = step.selector || { method: 'label', value: '' };
                                newStep.value = step.value || '';
                            } else if (value === 'click') {
                                newStep.selector = step.selector || { method: 'label', value: '' };
                            } else if (value === 'wait') {
                                newStep.timeout = step.timeout || 1000;
                            }
                            onChange(newStep);
                        }}
                    >
                        <SelectTrigger className="w-[160px] h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {STEP_TYPE_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    <div className="flex items-center gap-2">
                                        <option.icon className="w-3.5 h-3.5" />
                                        {option.label}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {step.type === 'goto' && (
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">URL</Label>
                        <Input
                            value={step.url || ''}
                            onChange={(e) => onChange({ ...step, url: e.target.value })}
                            placeholder="https://example.com/login"
                            className="h-8 text-sm font-mono"
                        />
                    </div>
                )}

                {step.type === 'fill' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Find Element By</Label>
                                <Select
                                    value={step.selector?.method || 'label'}
                                    onValueChange={(value) => onChange({
                                        ...step,
                                        selector: { ...step.selector!, method: value as SelectorMethod }
                                    })}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SELECTOR_METHOD_OPTIONS.filter(o => o.value !== 'role').map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">
                                    {step.selector?.method === 'label' ? 'Label Text' :
                                     step.selector?.method === 'placeholder' ? 'Placeholder Text' :
                                     step.selector?.method === 'text' ? 'Text Content' :
                                     step.selector?.method === 'testId' ? 'Test ID' : 'Selector Value'}
                                </Label>
                                <Input
                                    value={step.selector?.value || ''}
                                    onChange={(e) => onChange({
                                        ...step,
                                        selector: { ...step.selector!, value: e.target.value }
                                    })}
                                    placeholder={
                                        step.selector?.method === 'label' ? 'Username or email' :
                                        step.selector?.method === 'placeholder' ? 'Enter your email' :
                                        step.selector?.method === 'text' ? 'Sign in' :
                                        step.selector?.method === 'testId' ? 'email-input' : ''
                                    }
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Value to Fill</Label>
                            <Input
                                value={step.value || ''}
                                onChange={(e) => onChange({ ...step, value: e.target.value })}
                                placeholder="user@example.com"
                                className="h-8 text-sm"
                                type={step.selector?.value?.toLowerCase().includes('password') ? 'password' : 'text'}
                            />
                        </div>
                    </div>
                )}

                {step.type === 'click' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Find Element By</Label>
                                <Select
                                    value={step.selector?.method || 'label'}
                                    onValueChange={(value) => {
                                        const newSelector: AuthStepSelector = {
                                            method: value as SelectorMethod,
                                            value: step.selector?.value || ''
                                        };
                                        if (value === 'role') {
                                            newSelector.roleOptions = { name: '' };
                                        }
                                        onChange({ ...step, selector: newSelector });
                                    }}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SELECTOR_METHOD_OPTIONS.map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {step.selector?.method === 'role' ? (
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Role Type</Label>
                                    <Select
                                        value={step.selector?.value || 'button'}
                                        onValueChange={(value) => onChange({
                                            ...step,
                                            selector: { ...step.selector!, value }
                                        })}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLE_OPTIONS.map(role => (
                                                <SelectItem key={role} value={role}>
                                                    {role}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">
                                        {step.selector?.method === 'label' ? 'Label Text' :
                                         step.selector?.method === 'placeholder' ? 'Placeholder Text' :
                                         step.selector?.method === 'text' ? 'Text Content' :
                                         step.selector?.method === 'testId' ? 'Test ID' : 'Selector Value'}
                                    </Label>
                                    <Input
                                        value={step.selector?.value || ''}
                                        onChange={(e) => onChange({
                                            ...step,
                                            selector: { ...step.selector!, value: e.target.value }
                                        })}
                                        placeholder={
                                            step.selector?.method === 'label' ? 'Remember me' :
                                            step.selector?.method === 'placeholder' ? 'Search...' :
                                            step.selector?.method === 'text' ? 'Sign in' :
                                            step.selector?.method === 'testId' ? 'submit-btn' : ''
                                        }
                                        className="h-8 text-sm"
                                    />
                                </div>
                            )}
                        </div>
                        {step.selector?.method === 'role' && (
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Accessible Name</Label>
                                <Input
                                    value={step.selector?.roleOptions?.name || ''}
                                    onChange={(e) => onChange({
                                        ...step,
                                        selector: {
                                            ...step.selector!,
                                            roleOptions: { name: e.target.value }
                                        }
                                    })}
                                    placeholder="Sign in"
                                    className="h-8 text-sm"
                                />
                            </div>
                        )}
                    </div>
                )}

                {step.type === 'wait' && (
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Wait Duration (ms)</Label>
                        <Input
                            type="number"
                            value={step.timeout || 1000}
                            onChange={(e) => onChange({ ...step, timeout: parseInt(e.target.value) || 1000 })}
                            placeholder="1000"
                            className="h-8 text-sm w-32"
                            min={0}
                            step={100}
                        />
                    </div>
                )}
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
            >
                <Trash2 className="w-3.5 h-3.5" />
            </Button>
        </div>
    );
}

export function ConfigEditor({ open, onOpenChange }: ConfigEditorProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set([0]));
    const [expandedAuth, setExpandedAuth] = useState<Set<number>>(new Set());
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'project' | 'page' | 'authStep'; projectIndex: number; pageIndex?: number; stepIndex?: number } | null>(null);

    // Load configuration on mount
    useEffect(() => {
        if (open) {
            loadConfig();
        }
    }, [open]);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/config');
            if (!response.ok) throw new Error('Failed to load configuration');
            const data = await response.json();
            setProjects(data.projects || []);
            setHasChanges(false);
        } catch (error) {
            toast.error('Failed to load configuration', {
                description: String(error)
            });
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projects })
            });
            if (!response.ok) throw new Error('Failed to save configuration');
            setHasChanges(false);
            toast.success('Configuration saved', {
                description: 'Your changes have been written to data.ts'
            });
        } catch (error) {
            toast.error('Failed to save configuration', {
                description: String(error)
            });
        } finally {
            setSaving(false);
        }
    };

    const addProject = () => {
        const newIndex = projects.length;
        setProjects([...projects, {
            project: 'New Project',
            base_url: 'https://',
            pages: [{ label: 'Home', url: '/' }]
        }]);
        setExpandedProjects(prev => new Set([...prev, newIndex]));
        setHasChanges(true);
    };

    const removeProject = (index: number) => {
        setProjects(projects.filter((_, i) => i !== index));
        setExpandedProjects(prev => {
            const next = new Set(prev);
            next.delete(index);
            return next;
        });
        setHasChanges(true);
        setDeleteConfirm(null);
    };

    const updateProject = (index: number, field: keyof Project, value: string) => {
        const updated = [...projects];
        updated[index] = { ...updated[index], [field]: value };
        setProjects(updated);
        setHasChanges(true);
    };

    const addPage = (projectIndex: number) => {
        const updated = [...projects];
        updated[projectIndex].pages.push({ label: 'New Page', url: '/' });
        setProjects(updated);
        setHasChanges(true);
    };

    const removePage = (projectIndex: number, pageIndex: number) => {
        const updated = [...projects];
        updated[projectIndex].pages = updated[projectIndex].pages.filter((_, i) => i !== pageIndex);
        setProjects(updated);
        setHasChanges(true);
        setDeleteConfirm(null);
    };

    const updatePage = (projectIndex: number, pageIndex: number, field: keyof Page, value: string) => {
        const updated = [...projects];
        updated[projectIndex].pages[pageIndex] = {
            ...updated[projectIndex].pages[pageIndex],
            [field]: value
        };
        setProjects(updated);
        setHasChanges(true);
    };

    const toggleProject = (index: number) => {
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const toggleAuth = (index: number) => {
        setExpandedAuth(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    // Authentication step handlers
    const addAuthStep = (projectIndex: number) => {
        const updated = [...projects];
        if (!updated[projectIndex].authenticationSteps) {
            updated[projectIndex].authenticationSteps = [];
        }
        updated[projectIndex].authenticationSteps!.push({
            type: 'goto',
            url: ''
        });
        setProjects(updated);
        setHasChanges(true);
        setExpandedAuth(prev => new Set([...prev, projectIndex]));
    };

    const removeAuthStep = (projectIndex: number, stepIndex: number) => {
        const updated = [...projects];
        updated[projectIndex].authenticationSteps = updated[projectIndex].authenticationSteps?.filter((_, i) => i !== stepIndex);
        if (updated[projectIndex].authenticationSteps?.length === 0) {
            updated[projectIndex].authenticationSteps = undefined;
        }
        setProjects(updated);
        setHasChanges(true);
        setDeleteConfirm(null);
    };

    const updateAuthStep = (projectIndex: number, stepIndex: number, step: AuthStep) => {
        const updated = [...projects];
        if (updated[projectIndex].authenticationSteps) {
            updated[projectIndex].authenticationSteps![stepIndex] = step;
        }
        setProjects(updated);
        setHasChanges(true);
    };

    const moveAuthStep = (projectIndex: number, stepIndex: number, direction: 'up' | 'down') => {
        const updated = [...projects];
        const steps = updated[projectIndex].authenticationSteps;
        if (!steps) return;

        const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
        if (newIndex < 0 || newIndex >= steps.length) return;

        [steps[stepIndex], steps[newIndex]] = [steps[newIndex], steps[stepIndex]];
        setProjects(updated);
        setHasChanges(true);
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 flex flex-col gap-0"
                >
                    <SheetHeader className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <FolderOpen className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <SheetTitle className="text-lg">Scan Configuration</SheetTitle>
                                <SheetDescription className="text-sm">
                                    Configure projects, authentication, and pages to scan
                                </SheetDescription>
                            </div>
                        </div>
                        <Badge
                            variant={hasChanges ? 'default' : 'secondary'}
                            className={cn(
                                "absolute top-4 right-12 transition-all",
                                hasChanges ? "bg-amber-500 hover:bg-amber-600" : ""
                            )}
                        >
                            {hasChanges ? 'Unsaved changes' : 'Saved'}
                        </Badge>
                    </SheetHeader>

                    <div className="space-y-4 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Loading configuration...</p>
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                    <FileText className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">No projects configured</p>
                                    <p className="text-sm text-muted-foreground">Add a project to start scanning for accessibility issues</p>
                                </div>
                                <Button onClick={addProject} className="mt-2">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Your First Project
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {projects.map((project, projectIndex) => (
                                    <Collapsible
                                        key={projectIndex}
                                        open={expandedProjects.has(projectIndex)}
                                        onOpenChange={() => toggleProject(projectIndex)}
                                    >
                                        <Card className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow">
                                            <CardHeader className="p-0">
                                                <CollapsibleTrigger asChild>
                                                    <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                                                        <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                                                        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                                            <Globe className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <CardTitle className="text-sm font-medium truncate">
                                                                {project.project || 'Untitled Project'}
                                                            </CardTitle>
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {project.base_url} · {project.pages.length} page{project.pages.length !== 1 ? 's' : ''}
                                                                {project.authenticationSteps?.length ? ` · ${project.authenticationSteps.length} auth step${project.authenticationSteps.length !== 1 ? 's' : ''}` : ''}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {project.authenticationSteps?.length ? (
                                                                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                                                                    <KeyRound className="w-3 h-3 mr-1" />
                                                                    Auth
                                                                </Badge>
                                                            ) : null}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-sm"
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteConfirm({ type: 'project', projectIndex });
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                            {expandedProjects.has(projectIndex) ? (
                                                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </CollapsibleTrigger>
                                            </CardHeader>

                                            <CollapsibleContent>
                                                <Separator />
                                                <CardContent className="p-4 space-y-6">
                                                    {/* Project Details */}
                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`project-name-${projectIndex}`}>
                                                                Project Name
                                                            </Label>
                                                            <Input
                                                                id={`project-name-${projectIndex}`}
                                                                value={project.project}
                                                                onChange={(e) => updateProject(projectIndex, 'project', e.target.value)}
                                                                placeholder="My Website"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`base-url-${projectIndex}`}>
                                                                Base URL
                                                            </Label>
                                                            <Input
                                                                id={`base-url-${projectIndex}`}
                                                                value={project.base_url}
                                                                onChange={(e) => updateProject(projectIndex, 'base_url', e.target.value)}
                                                                placeholder="https://example.com"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Authentication Section */}
                                                    <Collapsible
                                                        open={expandedAuth.has(projectIndex)}
                                                        onOpenChange={() => toggleAuth(projectIndex)}
                                                    >
                                                        <div className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 overflow-hidden">
                                                            <CollapsibleTrigger asChild>
                                                                <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-amber-500/10 transition-colors">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-7 h-7 rounded-md bg-amber-500/20 flex items-center justify-center">
                                                                            <KeyRound className="w-4 h-4 text-amber-600" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-medium">Authentication Steps</p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {project.authenticationSteps?.length
                                                                                    ? `${project.authenticationSteps.length} step${project.authenticationSteps.length !== 1 ? 's' : ''} configured`
                                                                                    : 'No authentication configured'
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-7 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-500/20"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                addAuthStep(projectIndex);
                                                                            }}
                                                                        >
                                                                            <Plus className="w-3 h-3 mr-1" />
                                                                            Add Step
                                                                        </Button>
                                                                        {expandedAuth.has(projectIndex) ? (
                                                                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                                        ) : (
                                                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </CollapsibleTrigger>

                                                            <CollapsibleContent>
                                                                <div className="p-3 pt-0 space-y-3">
                                                                    {!project.authenticationSteps?.length ? (
                                                                        <div className="text-center py-6 text-sm text-muted-foreground">
                                                                            <p>No authentication steps yet.</p>
                                                                            <p className="text-xs mt-1">Add steps to log in before scanning protected pages.</p>
                                                                        </div>
                                                                    ) : (
                                                                        project.authenticationSteps.map((step, stepIndex) => (
                                                                            <AuthStepEditor
                                                                                key={stepIndex}
                                                                                step={step}
                                                                                index={stepIndex}
                                                                                totalSteps={project.authenticationSteps!.length}
                                                                                onChange={(newStep) => updateAuthStep(projectIndex, stepIndex, newStep)}
                                                                                onRemove={() => setDeleteConfirm({ type: 'authStep', projectIndex, stepIndex })}
                                                                                onMoveUp={() => moveAuthStep(projectIndex, stepIndex, 'up')}
                                                                                onMoveDown={() => moveAuthStep(projectIndex, stepIndex, 'down')}
                                                                            />
                                                                        ))
                                                                    )}
                                                                </div>
                                                            </CollapsibleContent>
                                                        </div>
                                                    </Collapsible>

                                                    {/* Pages Section */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                                                Pages to Scan
                                                            </Label>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => addPage(projectIndex)}
                                                                className="h-7 text-xs"
                                                            >
                                                                <Plus className="w-3 h-3 mr-1" />
                                                                Add Page
                                                            </Button>
                                                        </div>

                                                        <div className="space-y-2">
                                                            {project.pages.map((page, pageIndex) => (
                                                                <div
                                                                    key={pageIndex}
                                                                    className="group flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-transparent hover:border-border/50 transition-colors"
                                                                >
                                                                    <div className="flex-1 grid gap-2 sm:grid-cols-2">
                                                                        <div className="space-y-1.5">
                                                                            <Label
                                                                                htmlFor={`page-label-${projectIndex}-${pageIndex}`}
                                                                                className="text-xs text-muted-foreground"
                                                                            >
                                                                                Label
                                                                            </Label>
                                                                            <Input
                                                                                id={`page-label-${projectIndex}-${pageIndex}`}
                                                                                value={page.label}
                                                                                onChange={(e) => updatePage(projectIndex, pageIndex, 'label', e.target.value)}
                                                                                placeholder="Home"
                                                                                className="h-8 text-sm"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1.5">
                                                                            <Label
                                                                                htmlFor={`page-url-${projectIndex}-${pageIndex}`}
                                                                                className="text-xs text-muted-foreground"
                                                                            >
                                                                                URL Path
                                                                            </Label>
                                                                            <Input
                                                                                id={`page-url-${projectIndex}-${pageIndex}`}
                                                                                value={page.url}
                                                                                onChange={(e) => updatePage(projectIndex, pageIndex, 'url', e.target.value)}
                                                                                placeholder="/"
                                                                                className="h-8 text-sm font-mono"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon-sm"
                                                                        className="mt-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-opacity"
                                                                        onClick={() => setDeleteConfirm({ type: 'page', projectIndex, pageIndex })}
                                                                        disabled={project.pages.length <= 1}
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </CollapsibleContent>
                                        </Card>
                                    </Collapsible>
                                ))}
                            </div>
                        )}
                    </div>

                    <SheetFooter className="px-6 py-4 border-t border-border bg-muted/30">
                        <div className="flex items-center justify-between w-full">
                            <Button
                                variant="outline"
                                onClick={addProject}
                                disabled={loading}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Project
                            </Button>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={saveConfig}
                                    disabled={!hasChanges || saving}
                                    className="min-w-[100px]"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-destructive" />
                            Confirm Deletion
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteConfirm?.type === 'project'
                                ? `Are you sure you want to delete "${projects[deleteConfirm.projectIndex]?.project}"? This will remove all pages and authentication steps associated with this project.`
                                : deleteConfirm?.type === 'authStep'
                                ? 'Are you sure you want to delete this authentication step?'
                                : 'Are you sure you want to delete this page?'
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => {
                                if (deleteConfirm?.type === 'project') {
                                    removeProject(deleteConfirm.projectIndex);
                                } else if (deleteConfirm?.type === 'page' && deleteConfirm.pageIndex !== undefined) {
                                    removePage(deleteConfirm.projectIndex, deleteConfirm.pageIndex);
                                } else if (deleteConfirm?.type === 'authStep' && deleteConfirm.stepIndex !== undefined) {
                                    removeAuthStep(deleteConfirm.projectIndex, deleteConfirm.stepIndex);
                                }
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
