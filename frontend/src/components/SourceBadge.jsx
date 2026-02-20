'use client';

const SOURCE_COLORS = {
    alljobs: '#FF6B00', drushim: '#00A651', jobmaster: '#0066CC', linkedin: '#0A66C2',
    indeed: '#2164F3', gotfriends: '#E91E63', sqlink: '#FF5722', ethosia: '#9C27B0',
    secrettelaviv: '#FF4081', janglo: '#4CAF50', taasuka: '#607D8B', govil: '#3F51B5',
    shatil: '#009688', taasiya: '#795548', jobkarov: '#FFC107', xplace: '#673AB7',
    nbn: '#2196F3', glassdoor: '#0CAA41',
};

const SOURCE_NAMES = {
    alljobs: 'AllJobs', drushim: 'Drushim', jobmaster: 'JobMaster', linkedin: 'LinkedIn',
    indeed: 'Indeed', gotfriends: 'GotFriends', sqlink: 'SQLink', ethosia: 'Ethosia',
    secrettelaviv: 'Secret TLV', janglo: 'Janglo', taasuka: 'Taasuka', govil: 'Gov.il',
    shatil: 'Shatil', taasiya: 'Taasiya', jobkarov: 'JobKarov', xplace: 'xPlace',
    nbn: 'NBN', glassdoor: 'Glassdoor',
};

export default function SourceBadge({ source }) {
    const color = SOURCE_COLORS[source] || '#666';
    const name = SOURCE_NAMES[source] || source;

    return (
        <span
            className="source-badge"
            style={{ backgroundColor: color }}
            title={`מתוך ${name}`}
        >
            {name}
        </span>
    );
}
