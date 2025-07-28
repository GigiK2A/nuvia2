import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  MessageSquare, 
  FileText, 
  Code2, 
  Calendar,
  Folder,
  Trash2,
  Download,
  Share2,
  Globe,
  Cloud
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  type: 'chat' | 'document' | 'code';
  createdAt: string;
  userId?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: string;
  projectId: string;
}

interface Document {
  id: string;
  content: string;
  format: 'pdf' | 'word';
  createdAt: string;
  projectId: string;
}

interface CodeSnippet {
  id: string;
  filename: string;
  code: string;
  language: string;
  createdAt: string;
  projectId: string;
}

export default function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'document' | 'code'>('chat');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState<'chat' | 'document' | 'code'>('chat');
  const [loading, setLoading] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippet[]>([]);
  
  const { toast } = useToast();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chat': return <MessageSquare className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'code': return <Code2 className="w-4 h-4" />;
      default: return <Folder className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'chat': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'document': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'code': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data.data?.projects || data);
      } else {
        throw new Error('Failed to fetch projects');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProjectName,
          type: newProjectType,
          userId: 'current-user', // Replace with actual user ID
        }),
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects([...projects, newProject]);
        setNewProjectName('');
        setShowCreateDialog(false);
        toast({
          title: "Success",
          description: "Project created successfully",
        });
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProjectContent = async (project: Project) => {
    try {
      setLoading(true);
      setSelectedProject(project);
      setActiveTab(project.type);

      // Load content based on project type
      if (project.type === 'chat') {
        const response = await fetch(`/api/projects/${project.id}/chat`);
        if (response.ok) {
          const data = await response.json();
          setChatMessages(data.messages || []);
        }
      } else if (project.type === 'document') {
        const response = await fetch(`/api/projects/${project.id}/documents`);
        if (response.ok) {
          const data = await response.json();
          setDocuments(data.documents || []);
        }
      } else if (project.type === 'code') {
        const response = await fetch(`/api/projects/${project.id}/code`);
        if (response.ok) {
          const data = await response.json();
          setCodeSnippets(data.codeSnippets || []);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load project content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async (content: any, type: 'chat' | 'document' | 'code') => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });

      if (response.ok) {
        const savedContent = await response.json();
        
        // Update local state
        if (type === 'chat') {
          setChatMessages([...chatMessages, savedContent]);
        } else if (type === 'document') {
          setDocuments([...documents, savedContent]);
        } else if (type === 'code') {
          setCodeSnippets([...codeSnippets, savedContent]);
        }

        toast({
          title: "Success",
          description: "Content saved successfully",
        });
      } else {
        throw new Error(`Failed to save ${type}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save ${type}`,
        variant: "destructive",
      });
    }
  };

  const exportProject = async (projectId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/export/${projectId}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedProject?.name || 'project'}_export.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Project exported successfully",
        });
      } else {
        throw new Error('Failed to export project');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deployProject = async (projectId: string, platform: 'vercel' | 'render') => {
    try {
      setLoading(true);
      const endpoint = platform === 'vercel' 
        ? `/api/projects/${projectId}/deploy/vercel`
        : `/api/projects/${projectId}/deploy/render`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: platform === 'render' ? JSON.stringify({ repoPath: '/tmp/repo' }) : undefined,
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: `Project deployed to ${platform} successfully`,
        });
        console.log('Deployment result:', result);
      } else {
        throw new Error(`Failed to deploy to ${platform}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to deploy to ${platform}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Project Manager
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your AI projects with persistent storage
              </p>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Create a new project to organize your AI work
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Project Name</label>
                    <Input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Enter project name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Project Type</label>
                    <Select value={newProjectType} onValueChange={(value: 'chat' | 'document' | 'code') => setNewProjectType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chat">Chat AI</SelectItem>
                        <SelectItem value="document">Document Generator</SelectItem>
                        <SelectItem value="code">Code Generator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={createProject} disabled={loading} className="flex-1">
                      Create Project
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="w-5 h-5" />
                  Projects ({projects.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {loading && projects.length === 0 ? (
                    <div className="animate-pulse space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                      ))}
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No projects yet. Create your first project!
                    </div>
                  ) : (
                    projects.map((project) => (
                      <motion.div
                        key={project.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card 
                          className={`cursor-pointer transition-all ${
                            selectedProject?.id === project.id 
                              ? 'ring-2 ring-blue-500 shadow-md' 
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => loadProjectContent(project)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {getTypeIcon(project.type)}
                                <div>
                                  <h3 className="font-medium truncate max-w-32">
                                    {project.name}
                                  </h3>
                                  <p className="text-xs text-gray-500">
                                    {new Date(project.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge className={getTypeColor(project.type)}>
                                {project.type}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Project Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            {selectedProject ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getTypeIcon(selectedProject.type)}
                        {selectedProject.name}
                      </CardTitle>
                      <CardDescription>
                        Created {new Date(selectedProject.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => exportProject(selectedProject.id)}
                        disabled={loading}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export ZIP
                      </Button>
                      {selectedProject.type === 'code' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deployProject(selectedProject.id, 'vercel')}
                            disabled={loading}
                          >
                            <Globe className="w-4 h-4 mr-2" />
                            Deploy to Vercel
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deployProject(selectedProject.id, 'render')}
                            disabled={loading}
                          >
                            <Cloud className="w-4 h-4 mr-2" />
                            Deploy to Render
                          </Button>
                        </>
                      )}
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="chat" disabled={selectedProject.type !== 'chat'}>
                        Chat Messages
                      </TabsTrigger>
                      <TabsTrigger value="document" disabled={selectedProject.type !== 'document'}>
                        Documents
                      </TabsTrigger>
                      <TabsTrigger value="code" disabled={selectedProject.type !== 'code'}>
                        Code Snippets
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="chat" className="space-y-4">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No chat messages yet
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {chatMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`p-3 rounded-lg ${
                                message.role === 'user'
                                  ? 'bg-blue-50 dark:bg-blue-900/20 ml-8'
                                  : 'bg-gray-50 dark:bg-gray-800 mr-8'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={message.role === 'user' ? 'default' : 'secondary'}>
                                  {message.role}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(message.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm">{message.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="document" className="space-y-4">
                      {documents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No documents yet
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {documents.map((doc) => (
                            <Card key={doc.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge>{doc.format}</Badge>
                                  <span className="text-xs text-gray-500">
                                    {new Date(doc.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                                  {doc.content}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="code" className="space-y-4">
                      {codeSnippets.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No code snippets yet
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {codeSnippets.map((snippet) => (
                            <Card key={snippet.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Code2 className="w-4 h-4" />
                                    <span className="font-medium">{snippet.filename}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{snippet.language}</Badge>
                                    <span className="text-xs text-gray-500">
                                      {new Date(snippet.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                                  <code>{snippet.code.substring(0, 200)}...</code>
                                </pre>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Folder className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Select a Project
                  </h3>
                  <p className="text-gray-500">
                    Choose a project from the list to view its content
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}