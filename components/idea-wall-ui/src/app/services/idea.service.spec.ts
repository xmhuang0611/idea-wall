import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { IdeaService } from './idea.service';
import { Idea } from '../models/idea.model';

describe('IdeaService', () => {
  let service: IdeaService;
  let httpMock: HttpTestingController;
  const mockIdeas: Idea[] = [
    {
      _id: '1',
      title: 'Test Idea 1',
      description: 'Test Description 1',
      category: 'Idea',
      feeling: 1,
      tags: [1, 2],
      total_votes: 10,
      user_vote: 1,
      hasVoted: true,
      created_at: new Date(),
      creator_id: 'user1',
      creator_name: 'User One',
      updated_at: new Date(),
      updater_id: 'user1',
      updater_name: 'User One'
    },
    {
      _id: '2',
      title: 'Test Idea 2',
      description: 'Test Description 2',
      category: 'Pain',
      feeling: -1,
      tags: [3, 4],
      total_votes: 5,
      user_vote: -1,
      hasVoted: true,
      created_at: new Date(),
      creator_id: 'user2',
      creator_name: 'User Two',
      updated_at: new Date(),
      updater_id: 'user2',
      updater_name: 'User Two'
    }
  ];

  const mockApiResponse = {
    status: 'success',
    data: mockIdeas,
    meta: {
      page: 1,
      page_size: 10,
      total: 2
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IdeaService]
    });

    service = TestBed.inject(IdeaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all ideas with default params', () => {
    service.getIdeas().subscribe(response => {
      expect(response.status).toBe('success');
      expect(response.data.length).toBe(2);
      expect(response.data).toEqual(mockIdeas);
    });

    const req = httpMock.expectOne('/api/ideas');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.toString()).toBe('');
    req.flush(mockApiResponse);
  });

  it('should get ideas with custom params', () => {
    const params = {
      page: 2,
      page_size: 20,
      category: 'Idea',
      search: 'test',
      sort_by: 'created_at',
      sort_order: 'desc' as const
    };

    service.getIdeas(params).subscribe(response => {
      expect(response.status).toBe('success');
      expect(response.data.length).toBe(2);
      expect(response.data).toEqual(mockIdeas);
    });

    const req = httpMock.expectOne('/api/ideas?page=2&page_size=20&category=Idea&search=test&sort_by=created_at&sort_order=desc');
    expect(req.request.method).toBe('GET');
    req.flush(mockApiResponse);
  });

  it('should get idea by id', () => {
    const ideaId = '1';
    const mockResponse = {
      status: 'success',
      data: mockIdeas[0]
    };

    service.getIdeaById(ideaId).subscribe(response => {
      expect(response.status).toBe('success');
      expect(response.data).toEqual(mockIdeas[0]);
    });

    const req = httpMock.expectOne(`/api/ideas/${ideaId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should create idea', () => {
    const newIdea: Partial<Idea> = {
      title: 'New Idea',
      description: 'New Description',
      category: 'Idea',
      feeling: 1,
      tags: [1, 2]
    };

    const mockResponse = {
      status: 'success',
      data: { ...newIdea, _id: '3' } as Idea
    };

    service.createIdea(newIdea).subscribe(response => {
      expect(response.status).toBe('success');
      expect(response.data).toEqual(mockResponse.data);
    });

    const req = httpMock.expectOne('/api/ideas');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newIdea);
    req.flush(mockResponse);
  });

  it('should update idea', () => {
    const ideaId = '1';
    const updatedIdea: Partial<Idea> = {
      title: 'Updated Idea',
      description: 'Updated Description',
      feeling: -1
    };

    const mockResponse = {
      status: 'success',
      data: { ...mockIdeas[0], ...updatedIdea }
    };

    service.updateIdea(ideaId, updatedIdea).subscribe(response => {
      expect(response.status).toBe('success');
      expect(response.data).toEqual(mockResponse.data);
    });

    const req = httpMock.expectOne(`/api/ideas/${ideaId}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updatedIdea);
    req.flush(mockResponse);
  });

  it('should delete idea', () => {
    const ideaId = '1';
    const mockResponse = {
      status: 'success',
      data: null
    };

    service.deleteIdea(ideaId).subscribe(response => {
      expect(response.status).toBe('success');
      expect(response.data).toBeNull();
    });

    const req = httpMock.expectOne(`/api/ideas/${ideaId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  it('should vote for idea', () => {
    const ideaId = '1';
    const voteStatus = 1;
    const mockResponse = {
      status: 'success',
      data: null
    };

    service.voteIdea(ideaId, voteStatus).subscribe(response => {
      expect(response.status).toBe('success');
      expect(response.data).toBeNull();
    });

    const req = httpMock.expectOne('/api/votes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      vote_status: voteStatus,
      target_id: ideaId,
      target_type: 'Idea'
    });
    req.flush(mockResponse);
  });

  it('should add comment to idea', () => {
    const ideaId = '1';
    const comment = 'Test comment';
    const parentId = '2';
    const mockResponse = {
      status: 'success',
      data: {
        _id: '1',
        description: comment,
        parent_id: parentId
      }
    };

    service.addComment(ideaId, comment, parentId).subscribe(response => {
      expect(response.status).toBe('success');
      expect(response.data.description).toBe(comment);
      expect(response.data.parent_id).toBe(parentId);
    });

    const req = httpMock.expectOne(`/api/ideas/${ideaId}/comments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      description: comment,
      parent_id: parentId
    });
    req.flush(mockResponse);
  });

  it('should handle error when getting ideas', () => {
    const errorResponse = {
      status: 'error',
      error: {
        code: '404',
        message: 'Not Found'
      }
    };

    service.getIdeas().subscribe({
      next: () => fail('should have failed with 404 error'),
      error: (error) => {
        expect(error.status).toBe(404);
        expect(error.error).toEqual(errorResponse);
      }
    });

    const req = httpMock.expectOne('/api/ideas');
    req.flush(errorResponse, { status: 404, statusText: 'Not Found' });
  });
}); 