import React, { Component } from 'react'
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Redirect } from "react-router-dom";
import { ListGroup, ListGroupItem } from 'react-bootstrap';
import LoadingPage from './LoadingPage';
import find from "lodash/find";

const assessment = gql`
  query assessment($assessmentId: String!) {
    assessment(id: $assessmentId) {
      questions {
        id,
        text,
        description,
        question,
        choices {
          id,
          text,
          recommendation,
          isSelected
        }
      }
    } 
  }
  `

const updateAssessment = gql`
  mutation updateAssessment($assessmentId: String!, $questionId: String!, $selectedChoiceId: String!) {
    updateAssessment(assessmentId: $assessmentId, questionId: $questionId, selectedChoiceId: $selectedChoiceId) {
      id
    }
  }
`

class QuestionPage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      questionIndex: 0,
      selectedChoice: null
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextProps.data !== this.props.data && nextProps.data.assessment) {
      this.getLastResponse(nextState.questionIndex, nextProps.data.assessment);
    }
  }

  componentDidUpdate(lastProps, lastState) {
    if(lastState.questionIndex !== this.state.questionIndex) {
      this.getLastResponse(this.state.questionIndex, this.props.data.assessment);
    }
  }

  getLastResponse(questionIndex, assessment) {
    const { questions } = assessment;
    const question = questions[this.state.questionIndex]
    const selectedChoice = find(question.choices, { isSelected: true });
    if(selectedChoice) {
      this.setState({ selectedChoice: selectedChoice.id });
    }

    console.log(selectedChoice);
  }

  onPreviousClick = () => {
    this.setState(prevState => {
      return {
        questionIndex: prevState.questionIndex - 1,
        selectedChoice: null
      };
    })
  }

  onNextClick = () => {
    const assessmentId = this.props.match.params.assessmentId
    const questionId = this.props.data.assessment.questions[this.state.questionIndex].id
    if (this.state.selectedChoice) {
      this.props.mutate({
        variables: { assessmentId, questionId, selectedChoiceId: this.state.selectedChoice }
      })
        .then(({ data }) => {
          this.setState(prevState => {
            return {
              questionIndex: prevState.questionIndex + 1,
              selectedChoice: null
            };
          })
        })
    }
  }

  selectChoice = (id) => {
    this.setState({ selectedChoice: id })
  }

  render() {
    const assesmentId = this.props.match.params.assessmentId
    if (!this.props.data.loading) {
      const questions = this.props.data.assessment.questions;
      const question = questions[this.state.questionIndex]

      if (this.state.questionIndex < questions.length) {
        return (
          <div className='question-page' >
            <div className='question-box'>

              <div className={'question-img question-id-' + question.id}> </div>
              <h2>{question.text}</h2>
              <p> {question.description}</p>
              <p className='question'> {question.question}</p>
              <ListGroup>
                {question.choices.map((choice, index) => {
                  const className = (choice.id === this.state.selectedChoice) ? 'selected' : '';
                  return (
                    <ListGroupItem
                      className={className}
                      key={index}
                      onClick={() => this.selectChoice(choice.id)}>
                      <div className='row'>
                        <div className='col-md-1'>
                          <span className='number'>{index + 1} </span>
                        </div>
                        <div className='col-md-11'>{choice.text}</div>
                      </div>
                    </ListGroupItem>
                  )
                })}
              </ListGroup>
              <div>
                {this.state.questionIndex > 0 &&
                  <a className='question-previous' onClick={this.onPreviousClick}>
                    <span className='prev-icon glyphicon glyphicon-chevron-left'></span>
                    <span>Previous</span>
                  </a>
                }
                <a className='question-next' onClick={this.onNextClick}>
                  <span> {this.state.questionIndex < questions.length - 1 ? 'Next' : 'See Results'} </span>
                  <span className='next-icon glyphicon glyphicon-chevron-right'></span>
                </a>
              </div>
            </div>
          </div>
        )
      } else {
        return (
          <Redirect to={`/assessment/${assesmentId}/results`} />
        )
      }
    } else {
      return (
       <LoadingPage />
      )
    }
  }
}

export default graphql(updateAssessment)(graphql(assessment, {
  options: props => ({ variables: { assessmentId: props.match.params.assessmentId } }),
})(QuestionPage));

