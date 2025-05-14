import { Injectable } from '@angular/core';
import { Tag } from '../../models/tag.model';

export interface TagOption {
  tag_id: number;
  label: string;
  parentId?: number;
  parentName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TagUtilService {
  
  constructor() { }
  
  /**
   * Format tags for display, showing child tags as "ParentName - ChildName"
   * @param tags Array of tags to format
   * @param excludeParents Whether to exclude parent tags from the result
   * @returns Formatted tag options
   */
  formatTagsForDisplay(tags: Tag[], excludeParents: boolean = false): TagOption[] {
    // Find parent tags (parent_id is 0 or null)
    const parentTags = tags.filter(tag => !tag.parent_id || tag.parent_id === 0);
    // Find child tags (parent_id is not 0 and not null)
    const childTags = tags.filter(tag => tag.parent_id && tag.parent_id !== 0);
    
    // Create formatted parent tags
    const formattedParentTags = parentTags.map(tag => ({
      tag_id: tag.tag_id,
      label: tag.tag_name,
      parentId: tag.parent_id,
      parentName: tag.tag_name
    }));
    
    // Create formatted child tags with parent tag name prefix
    const formattedChildTags = childTags.map(childTag => {
      const parentTag = parentTags.find(parent => parent.tag_id === childTag.parent_id);
      const parentName = parentTag ? parentTag.tag_name : '';
      const prefix = parentTag ? `${parentTag.tag_name} - ` : '';
      return {
        tag_id: childTag.tag_id,
        label: `${prefix}${childTag.tag_name}`,
        parentId: childTag.parent_id,
        parentName: parentName
      };
    });
    
    // Either return all tags or just child tags based on excludeParents
    let result = excludeParents ? formattedChildTags : [...formattedParentTags, ...formattedChildTags];
    
    // Sort tags by parent name, then by label
    return this.sortTagsByParent(result);
  }
  
  /**
   * Sort tags by parent name, then by their own label
   * @param tags Array of tag options to sort
   * @returns Sorted array of tag options
   */
  sortTagsByParent(tags: TagOption[]): TagOption[] {
    return tags.sort((a, b) => {
      // First sort by parent name
      const parentA = a.parentName || '';
      const parentB = b.parentName || '';
      
      if (parentA !== parentB) {
        return parentA.localeCompare(parentB);
      }
      
      // If parent names are the same, sort by label
      return a.label.localeCompare(b.label);
    });
  }
} 